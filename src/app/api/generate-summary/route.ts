import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bookTitle, notes } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "Jsi literární expert, který vytváří kvalitní shrnutí knih na základě čtenářských poznámek. Tvým úkolem je vytvořit strukturované shrnutí, které zachytí hlavní myšlenky, témata a klíčové momenty knihy. Shrnutí by mělo být informativní a užitečné pro pozdější reference.",
        },
        {
          role: "user",
          content: `Vytvoř strukturované shrnutí knihy "${bookTitle}" na základě následujících čtenářských poznámek. Zaměř se na:

1. Hlavní dějovou linii
2. Klíčové postavy a jejich vývoj
3. Hlavní témata a motivy
4. Důležité momenty a zvraty
5. Celkové poselství nebo význam díla

Poznámky k dílu:
${notes}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
