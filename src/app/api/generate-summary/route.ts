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

  // Add sections based on focus
  if (preferences.focus === "characters" || preferences.focus === "balanced") {
    sections.push("- Detailní analýza hlavních postav a jejich vývoje");
  }

  if (preferences.focus === "themes" || preferences.focus === "balanced") {
    sections.push("- Hlavní témata a motivy díla");
  }

  if (preferences.focus === "plot" || preferences.focus === "balanced") {
    sections.push("- Podrobný rozbor děje a struktury díla");
  }

  // Determine style
  let style = "";
  if (preferences.style === "academic") {
    style =
      "Používej akademický styl psaní s důrazem na analýzu a kritické hodnocení.";
  } else if (preferences.style === "casual") {
    style = "Používej neformální, přístupný styl psaní.";
  } else if (preferences.style === "creative") {
    style = "Používej kreativní, poutavý styl vyprávění.";
  }

  // Determine length
  let lengthInstruction = "";
  if (preferences.length === "short") {
    lengthInstruction = "Vytvoř stručné shrnutí (přibližně 150-200 slov).";
  } else if (preferences.length === "medium") {
    lengthInstruction =
      "Vytvoř středně dlouhé shrnutí (přibližně 300-400 slov).";
  } else if (preferences.length === "long") {
    lengthInstruction = "Vytvoř podrobné shrnutí (přibližně 500-700 slov).";
  }

  // Determine language
  const language =
    preferences.language === "cs" ? "Piš v češtině." : "Piš v angličtině.";

  return `Jsi literární expert, který vytváří kvalitní shrnutí knih. ${style} ${lengthInstruction} ${language}

Vytvoř strukturované shrnutí knihy "${bookTitle}" od autora ${author}. Zaměř se na:

${sections.join("\n")}

${notes ? `\nPoznámky čtenáře k dílu:\n${notes}` : ""}`;
}

export async function POST(request: Request) {
  try {
    const { bookTitle, bookAuthor, notes, preferences } = await request.json();

    if (!bookTitle || !bookAuthor || !preferences) {
      return NextResponse.json(
        { error: "Chybí povinné parametry" },
        { status: 400 }
      );
    }

    const prompt = generatePrompt(bookTitle, bookAuthor, notes, preferences);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: preferences.style === "creative" ? 0.8 : 0.6,
      max_tokens: 1000,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error("Nepodařilo se získat odpověď z OpenAI API");
    }

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat shrnutí" },
      { status: 500 }
    );
  }
}
