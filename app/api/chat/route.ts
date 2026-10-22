import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { message, source, history } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 }
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

    const sources = (matchedSources || []).filter((item) => {
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
9. Language: Detect the language AND script of the user's message and reply in the same language and script (for example: Roman Urdu written in Latin letters → reply in Roman Urdu; Urdu written in Arabic script → reply in Urdu script; Arabic → Arabic; English → English). When citing Arabic source texts, quote the Arabic briefly and explain it in the user's language. If the language is unclear, default to English.
10. Conversation: The messages above the final user message are the earlier conversation. Use them to understand follow-up questions and references (for example "uski misaal do" refers to the earlier topic). Answer consistently with what you said before, but treat the DATABASE SOURCES supplied with the current message as the authority for facts and references.
11. Writing style: Write in simple, everyday language that an ordinary person can read easily. In Roman Urdu, use plain Latin letters the way people normally type (write "nikah", "misaal", "maloomat") and do NOT use transliteration symbols or special letters (no ʿ, ā, ī, ū, ṭ, ḍ, ṣ, ḥ or similar marks) in any language. Prefer common everyday words over heavy scholarly terms, and keep sentences short and clear.
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
    });
  } catch (error) {
    console.error("API error:", error);

    return Response.json(
      { error: "Unable to get an AI response." },
      { status: 500 }
    );
  }
}
