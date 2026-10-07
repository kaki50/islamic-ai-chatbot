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

    let query = supabase
      .from("islamic_sources")
      .select(
        "source_type, tradition, title, author, reference, content"
      )
      .limit(5);

    if (selectedSource !== "All Sources") {
      query = query.or(
        `tradition.eq.${selectedSource},source_type.eq.${selectedSource}`
      );
    }

    const { data: sources, error: searchError } = await query;

    if (searchError) {
      console.error("Supabase error:", searchError);
    }

    const sourceText =
      sources && sources.length > 0
        ? sources
            .map(
              (item) =>
                `Source Type: ${item.source_type}
Tradition: ${item.tradition || "Not specified"}
Title: ${item.title}
Author: ${item.author || "Unknown"}
Reference: ${item.reference || "Not provided"}
Content: ${item.content}`
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
1. Use the database sources when they are relevant.
2. Clearly distinguish Qur'an, Hadith, fiqh/madhhab, tafsir, and broader scholarly traditions.
3. Never invent references or claim a source exists when it does not.
4. If the database contains no relevant source, clearly say so.
5. If scholars or schools differ, explain the differences respectfully.
6. Treat Wahhabi / Najdi reform tradition as a scholarly/reform tradition, not a separate fiqh madhhab.
7. Treat Deobandi, Barelvi, and Ahl-e-Hadith as broader scholarly traditions rather than automatically treating them as separate madhhabs.
8. Do not present a fiqh school's position as universally agreed upon.
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
    console.error(error);

    return Response.json(
      { error: "Unable to get an AI response." },
      { status: 500 }
    );
  }
}
