import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Free plan: this many questions per day (Pakistan time). Premium: no limit.
const FREE_DAILY_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const { message, source, history } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    // ----- Plan & daily-limit check -----
    // Logged-in users are counted per account; guests per connection (IP).
    // Premium accounts are never counted. If anything in this check
    // fails, the chat still works (we never block on an error here).
    let usage: {
      allowed: boolean;
      plan: string;
      remaining: number | null;
    } = { allowed: true, plan: "free", remaining: null };
    try {
      let userId: string | null = null;
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        if (data?.user) userId = data.user.id;
      }
      const ipRaw = (request.headers.get("x-forwarded-for") || "local")
        .split(",")[0]
        .trim();
      const ipHash = createHash("sha256")
        .update(ipRaw)
        .digest("hex")
        .slice(0, 32);
      const todayPkt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Karachi",
      }).format(new Date());
      const { data: usageData, error: usageError } = await (
        supabase as any
      ).rpc("charge_usage", {
        p_user: userId,
        p_ip: ipHash,
        p_day: todayPkt,
        p_limit: FREE_DAILY_LIMIT,
      });
      if (!usageError && usageData) {
        usage = usageData;
      }
    } catch {
      // Fail open: a broken limit check must never break the chat.
    }

    if (!usage.allowed) {
      return Response.json(
        { error: "limit_reached", plan: usage.plan, limit: FREE_DAILY_LIMIT },
        { status: 429 }
      );
    }

    const selectedSource =
      typeof source === "string" ? source : "All Sources";

    // Conversation history (for follow-up questions). Keep only valid
    // user/assistant turns, most recent last, capped for safety.
    const cleanHistory: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string" &&
                item.content.trim().length > 0
            )
            .slice(-10)
            .map((item) => ({
              role: item.role as "user" | "assistant",
              content: item.content.slice(0, 4000),
            }))
        : [];

    // For retrieval, include the previous user question so short
    // follow-ups ("give an example", "aur batao") still find sources.
    const previousUserMessage = [...cleanHistory]
      .reverse()
      .find((item) => item.role === "user")?.content;
    const rawRetrievalText = previousUserMessage
      ? previousUserMessage + "\n" + message
      : message;

    // Rewrite the question into a short English search query before
    // embedding. The database sources are embedded mainly from English
    // summaries and Arabic text, so non-English questions (Roman Urdu,
    // Urdu, etc.) retrieve poorly when embedded raw. The final answer is
    // still generated from the original message in the user's language.
    let retrievalText = rawRetrievalText;
    try {
      const rewrite = await openai.responses.create({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You rewrite a user's question into a short English search query for an Islamic sources database (Qur'an, Hadith, tafsir, fiqh). If the question is already in English, return it lightly cleaned. Translate Roman Urdu, Urdu, Arabic and other languages into clear English, keeping names, book names and references. Output ONLY the search query, nothing else.",
          },
          { role: "user", content: rawRetrievalText },
        ],
      });
      const rewritten = rewrite.output_text?.trim();
      if (rewritten) retrievalText = rewritten;
    } catch {
      // If the rewrite fails, fall back to the raw question text.
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: retrievalText,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: matchedSources, error: searchError } =
      await supabase.rpc("match_islamic_sources", {
        query_embedding: queryEmbedding,
        match_count: 10,
      });

    if (searchError) {
      console.error("Supabase search error:", searchError);

      return Response.json(
        { error: "Database search failed." },
        { status: 500 }
      );
    }

    // --- Retrieval safety nets (both fail-safe) ---
    // The vector index search is approximate and the question rewrite
    // varies slightly from run to run, so a relevant source (most
    // often a fact row) can occasionally be missed. Two extra nets:
    // 1. also search with the RAW question text and merge the results;
    // 2. an exact (non-approximate) check over the small fact
    //    categories — its best rows go first.
    let mergedSources: any[] = matchedSources || [];
    try {
      if (rawRetrievalText.trim() !== retrievalText.trim()) {
        const rawEmb = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: rawRetrievalText,
        });
        const { data: rawMatches } = await supabase.rpc(
          "match_islamic_sources",
          {
            query_embedding: rawEmb.data[0].embedding,
            match_count: 10,
          }
        );
        if (rawMatches && rawMatches.length > 0) {
          const byKey = new Map<string, any>();
          for (const item of [...mergedSources, ...rawMatches]) {
            const key = String(item.id ?? item.title ?? "");
            const prev = byKey.get(key);
            if (!prev || (item.similarity ?? 0) > (prev.similarity ?? 0)) {
              byKey.set(key, item);
            }
          }
          mergedSources = [...byKey.values()]
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 12);
        }
      }
    } catch {
      // Keep the primary results.
    }

    try {
      const { data: factMatches } = await (supabase as any).rpc(
        "match_facts_exact",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 3,
        }
      );
      if (factMatches && factMatches.length > 0) {
        const factKeys = new Set(
          factMatches.map((f: any) => String(f.id ?? f.title ?? ""))
        );
        mergedSources = [
          ...factMatches,
          ...mergedSources.filter(
            (item) => !factKeys.has(String(item.id ?? item.title ?? ""))
          ),
        ].slice(0, 12);
      }
    } catch {
      // Function may not be installed yet — ignore.
    }

    const sources = mergedSources.filter((item) => {
      if (selectedSource === "All Sources") return true;

      return (
        item.tradition === selectedSource ||
        item.source_type === selectedSource
      );
    });

    const sourceText =
      sources.length > 0
        ? sources
            .map((item) =>
              [
                "Source Type: " + (item.source_type || "Not specified"),
                "Category: " + (item.category || "Not specified"),
                "Tradition: " + (item.tradition || "Not specified"),
                "Title: " + (item.title || "Not provided"),
                "Author: " + (item.author || "Unknown"),
                "Reference: " + (item.reference || "Not provided"),
                "Arabic Text: " + (item.arabic_text || "Not provided"),
                "Content: " + (item.content || "Not provided"),
                "Similarity: " + (item.similarity ?? "Not available"),
              ].join("\n")
            )
            .join("\n\n")
        : "No matching database sources were found.";

    const systemPrompt = `
You are an Islamic information assistant.

The user selected:
${selectedSource}

DATABASE SOURCES:
${sourceText}

Rules:
1. Use the supplied database sources when relevant.
2. Never invent Qur'an verses, Hadith, references, quotations, or source details.
3. If no relevant database source is found, say so clearly. General information may be provided separately, but label it as not verified against the database.
4. Clearly distinguish Qur'an, Hadith, fiqh/madhhab, tafsir, and broader scholarly traditions.
5. Explain scholarly differences respectfully. Do not present one school's view as universally agreed upon.
6. Treat Wahhabi / Najdi reform tradition as a scholarly/reform tradition, not a separate fiqh madhhab.
7. Treat Deobandi, Barelvi, and Ahl-e-Hadith as broader scholarly traditions rather than automatically treating them as separate madhhabs.
8. Never claim a source was verified unless the supplied database content supports that claim.
9. Language: Detect the language AND script of the user's message and reply in the same language and script (for example: Roman Urdu written in Latin letters → reply in Roman Urdu; Urdu written in Arabic script → reply in Urdu script; Arabic → Arabic; English → English). Always follow the language and script of the user's LATEST message, even if earlier messages in the conversation were in a different language or script — switch immediately when the user switches. When citing Arabic source texts, quote the Arabic briefly and explain it in the user's language. If the language is unclear, default to English.
10. Conversation: The messages above the final user message are the earlier conversation. Use them to understand follow-up questions and references (for example "uski misaal do" refers to the earlier topic). Answer consistently with what you said before, but treat the DATABASE SOURCES supplied with the current message as the authority for facts and references.
11. Writing style: Write in simple, everyday language that an ordinary person can read easily. In Roman Urdu, use plain Latin letters the way people normally type (write "nikah", "misaal", "maloomat") and do NOT use transliteration symbols or special letters (no ʿ, ā, ī, ū, ṭ, ḍ, ṣ, ḥ or similar marks) in any language. Prefer common everyday words over heavy scholarly terms, and keep sentences short and clear.
12. The database is YOUR OWN knowledge base. When you mention it, always say "my database" (for example in Roman Urdu: "mere database mein ye maloomat mojood hai"; in Urdu script: "میرے ڈیٹابیس میں"). NEVER say "the database you provided", "the database you gave", "the supplied database" or anything suggesting the user handed it to you.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...cleanHistory,
        {
          role: "user",
          content: message,
        },
      ],
    });

    return Response.json({
      answer: response.output_text,
      usage: {
        plan: usage.plan,
        remaining: usage.remaining,
        limit: FREE_DAILY_LIMIT,
      },
    });
  } catch (error) {
    console.error("API error:", error);

    return Response.json(
      { error: "Unable to get an AI response." },
      { status: 500 }
    );
  }
}
