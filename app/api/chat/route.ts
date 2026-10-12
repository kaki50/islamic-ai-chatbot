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
    const { message, source } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const selectedSource =
      typeof source === "string" ? source : "All Sources";

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
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
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
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
