import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bookTitle, notes } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Jsi užitečný pomocník, který generuje shrnutí knihy na základě uživatelských poznámek.",
        },
        {
          role: "user",
          content: `Vygeneruj shrnutí knihy "${bookTitle}" na základě následujících poznámek:\n\n${notes}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      summary:
        response.choices[0].message.content ||
        "Nepodařilo se vygenerovat shrnutí.",
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat shrnutí" },
      { status: 500 }
    );
  }
}
