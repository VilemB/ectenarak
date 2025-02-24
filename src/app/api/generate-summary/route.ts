import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bookTitle, author, notes } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Jsi literární expert, který vytváří kvalitní shrnutí knih. Tvým úkolem je vytvořit strukturované shrnutí knihy, které zachytí hlavní dějovou linii, postavy, témata a poselství díla. Pokud jsou k dispozici poznámky čtenáře, zahrň je do kontextu.",
        },
        {
          role: "user",
          content: `Vytvoř strukturované shrnutí knihy "${bookTitle}" od autora ${author}. Zaměř se na:

1. Hlavní dějovou linii
2. Klíčové postavy a jejich charakteristiku
3. Hlavní témata a motivy
4. Historický a kulturní kontext
5. Celkové poselství nebo význam díla

${notes ? `\nPoznámky čtenáře k dílu:\n${notes}` : ""}`,
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
