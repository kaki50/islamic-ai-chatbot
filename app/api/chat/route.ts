import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  try {
    const { data, error } = await supabase
      .from("islamic_sources")
      .select("id, source_type, tradition, title, reference, content")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("SUPABASE TEST ERROR:", error);

      return Response.json(
        {
          error: "Supabase error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      source: data,
    });
  } catch (error) {
    console.error("TEST ERROR:", error);

    return Response.json(
      {
        error: "Test failed",
      },
      { status: 500 }
    );
  }
}
