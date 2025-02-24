import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SummaryPreferences } from "@/components/SummaryPreferencesModal";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generatePrompt(
  bookTitle: string,
  author: string,
  notes: string | undefined,
  preferences: SummaryPreferences
) {
  const sections = [];

  if (preferences.includeCharacterAnalysis) {
    sections.push("- Detailní analýza hlavních postav a jejich vývoje");
  }

  if (preferences.includeHistoricalContext) {
    sections.push("- Historický a kulturní kontext díla");
  }

  if (preferences.includeThemes) {
    sections.push("- Hlavní témata a motivy díla");
  }

  const style =
    preferences.style === "academic"
      ? "Používej akademický styl psaní s důrazem na analýzu a kritické hodnocení."
      : "Používej vyprávěcí styl, který zaujme čtenáře a přiblíží jim dílo poutavou formou.";

  const language =
    preferences.language === "formal"
      ? "Piš formálním jazykem."
      : "Piš neformálním, přístupným jazykem.";

  const opinion = preferences.includePersonalOpinion
    ? "\n\nNa závěr přidej subjektivní hodnocení díla a jeho významu v kontextu literatury."
    : "";

  return `Jsi literární expert, který vytváří kvalitní shrnutí knih. ${style} ${language}

Vytvoř strukturované shrnutí knihy "${bookTitle}" od autora ${author}. Zaměř se na:

- Hlavní dějovou linii a strukturu díla
${sections.join("\n")}

${notes ? `\nPoznámky čtenáře k dílu:\n${notes}` : ""}${opinion}`;
}

export async function POST(request: Request) {
  try {
    const { bookTitle, author, notes, preferences } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: generatePrompt(bookTitle, author, notes, preferences),
        },
      ],
      temperature: preferences.style === "storytelling" ? 0.8 : 0.6,
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
