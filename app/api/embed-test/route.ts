
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.EMBED_TEST_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: source, error } = await supabase
      .from("islamic_sources")
      .select("id, title, reference, content, arabic_text")
      .eq("id", 1)
      .single();

    if (error) throw new Error("Database read failed: " + error.message);

    const textToEmbed = [
      source.title,
      source.reference,
      source.content,
      source.arabic_text,
    ].filter(Boolean).join("\n");

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { error: updateError } = await supabase
      .from("islamic_sources")
      .update({ embedding })
      .eq("id", 1);

    if (updateError) throw new Error("Embedding save failed: " + updateError.message);

    return Response.json({
      success: true,
      message: "Test source embedding saved.",
      source_id: source.id,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("Embedding test error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Embedding test failed." },
      { status: 500 }
    );
  }
}
