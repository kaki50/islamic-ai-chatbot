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

    const { data: sources, error: searchError } = await supabase
      .from("islamic_sources")
      .select("source_type, tradition, title, author, reference, content")
      .or(
        `tradition.eq.${selectedSource},source_type.eq.${selectedSource}`
      )
      .limit(5);

    if (searchError) {
      console.error("Supabase error:", searchError);
    }

    const sourceText =
      sources && sources.length > 0
        ? sources
            .map(
              (item) =>
                `Source: ${item.title}\nAuthor: ${item.author || "Unknown"}\nReference: ${item.reference || "Not provided"}\nContent: ${item.content}`
            )
            .join("\n\n")
        : "No matching database sources were found.";

    const systemPrompt = `
You are an Islamic information assistant.

The user selected:
${selectedSource}

Use the database sources below when relevant:

${sourceText}

Rules:
1. Distinguish Qur'an, Hadith, fiqh/madhhab, and broader scholarly traditions.
2. Never invent references.
3. Never claim a database source exists if it does not.
4. If the database has no relevant source, clearly say that no matching database source was found.
5. If scholars or schools differ, explain the differences respectfully.
6. Treat Wahhabi / Najdi reform tradition as a scholarly/reform tradition, not a separate fiqh madhhab.
7. Treat Deobandi, Barelvi, and Ahl-e-Hadith as broader scholarly traditions rather than automatically treating them as separate madhhabs.
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
