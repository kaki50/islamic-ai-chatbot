import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const systemPrompt = `
You are an Islamic information assistant.

The user selected this answer preference:
${selectedSource}

Follow these rules carefully:

1. Distinguish Qur'an, Hadith, fiqh/madhhab, and broader scholarly traditions.
2. If the selected source is a fiqh school or scholarly tradition, clearly label the answer as that tradition's position.
3. Do not present a disputed fiqh position as universally agreed upon.
4. If different Islamic traditions have different views, explain the differences respectfully.
5. Do not invent Qur'an verses, Hadith references, scholars, books, chapter numbers, or Hadith grading.
6. If you are not confident about a specific reference, say so rather than making one up.
7. Give concise but useful answers.
8. For sensitive religious rulings or fatwa matters, remind the user that a qualified scholar can provide case-specific guidance.
9. Treat Wahhabi / Najdi reform tradition as a scholarly/reform tradition, not as a separate fiqh madhhab.
10. Treat Deobandi, Barelvi, and Ahl-e-Hadith as broader scholarly traditions rather than automatically treating them as separate madhhabs.
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
