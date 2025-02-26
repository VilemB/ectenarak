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
    lengthInstruction =
      "Vytvoř stručné shrnutí (přibližně 150-200 slov). Ujisti se, že shrnutí bude kompletní a nebude náhle ukončeno.";
  } else if (preferences.length === "medium") {
    lengthInstruction =
      "Vytvoř středně dlouhé shrnutí (přibližně 300-400 slov). Ujisti se, že shrnutí bude kompletní a nebude náhle ukončeno.";
  } else if (preferences.length === "long") {
    lengthInstruction =
      "Vytvoř podrobné shrnutí (přibližně 500-700 slov). Ujisti se, že shrnutí bude kompletní a nebude náhle ukončeno.";
  }

  // Determine language
  const language =
    preferences.language === "cs" ? "Piš v češtině." : "Piš v angličtině.";

  return `Jsi literární expert, který vytváří kvalitní shrnutí knih. ${style} ${lengthInstruction} ${language}

Vytvoř strukturované shrnutí knihy "${bookTitle}" od autora ${author}. Zaměř se na:

${sections.join("\n")}

Důležité: Vždy dokončuj své myšlenky a zajisti, že shrnutí bude mít jasný závěr. Pokud se blížíš k limitu tokenů, raději některé části zkrať, ale nikdy nenechávej shrnutí nedokončené.

${notes ? `\nPoznámky čtenáře k dílu:\n${notes}` : ""}`;
}

function checkIfSummaryIsCutOff(summary: string): string {
  // Check if the summary ends abruptly with no punctuation
  const lastChar = summary.trim().slice(-1);
  const properEndingPunctuation = [".", "!", "?", '"', ")", "]", "}"].includes(
    lastChar
  );

  // Check if the last sentence is complete (has a subject and verb)
  const lastSentence = summary.split(/[.!?]/).pop()?.trim() || "";
  const isTooShort = lastSentence.split(" ").length < 3;

  if (!properEndingPunctuation || isTooShort) {
    return (
      summary +
      "\n\n*Poznámka: Toto shrnutí mohlo být zkráceno kvůli omezení délky. Pro úplné shrnutí zvažte použití kratšího nastavení nebo rozdělení poznámek do více knih.*"
    );
  }

  return summary;
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

    // Set max_tokens based on the length preference
    let maxTokens;
    switch (preferences.length) {
      case "short":
        maxTokens = 800; // For short summaries (150-200 words)
        break;
      case "medium":
        maxTokens = 1500; // For medium summaries (300-400 words)
        break;
      case "long":
        maxTokens = 2500; // For long summaries (500-700 words)
        break;
      default:
        maxTokens = 1500; // Default to medium
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: preferences.style === "creative" ? 0.8 : 0.6,
      max_tokens: maxTokens,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error("Nepodařilo se získat odpověď z OpenAI API");
    }

    // Check if the summary appears to be cut off
    const processedSummary = checkIfSummaryIsCutOff(summary);

    return NextResponse.json({
      summary: processedSummary,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat shrnutí" },
      { status: 500 }
    );
  }
}
