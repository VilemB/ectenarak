import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generatePrompt(author: string) {
  return `Vytvoř stručné shrnutí (150-200 slov) o autorovi "${author}". 
  Zaměř se na jeho/její život, literární kariéru, významná díla, literární styl a přínos literatuře.
  Piš v češtině, akademickým stylem, ale srozumitelně.
  Shrnutí musí být kompletní s jasným závěrem.`;
}

export async function POST(request: Request) {
  try {
    const { author } = await request.json();

    if (!author) {
      return NextResponse.json(
        { error: "Chybí jméno autora" },
        { status: 400 }
      );
    }

    const prompt = generatePrompt(author);
    const model = "gpt-4o-mini";

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error("Nepodařilo se získat odpověď z OpenAI API");
    }

    return NextResponse.json({
      summary: summary,
    });
  } catch (error) {
    console.error("Error generating author summary:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat shrnutí autora" },
      { status: 500 }
    );
  }
}
