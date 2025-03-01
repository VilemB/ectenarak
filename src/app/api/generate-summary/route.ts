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
  // Simplified section generation
  const focusMap = {
    plot: "děj a strukturu díla",
    characters: "hlavní postavy a jejich vývoj",
    themes: "hlavní témata a motivy díla",
    balanced: "děj, postavy i témata vyváženě",
  };

  // Simplified style instructions
  const styleMap = {
    academic: "akademický, analytický",
    casual: "neformální, přístupný",
    creative: "kreativní, poutavý",
  };

  // Simplified length instructions with word counts
  const lengthMap = {
    short: "stručné (150-200 slov)",
    medium: "středně dlouhé (300-400 slov)",
    long: "podrobné (500-700 slov)",
  };

  // Language is simplified to a single word
  const language = preferences.language === "cs" ? "česky" : "anglicky";

  // Build the prompt with optional exam focus and literary context
  let prompt = `Vytvoř ${
    lengthMap[preferences.length]
  } shrnutí knihy "${bookTitle}" od ${author} ve stylu ${
    styleMap[preferences.style]
  }. Zaměř se na ${focusMap[preferences.focus]}. Piš ${language}.`;

  // Add exam focus instructions if enabled
  if (preferences.examFocus) {
    prompt += `

Strukturuj shrnutí podle požadavků maturitní zkoušky z českého jazyka a literatury. Zahrň:
1. Základní informace o díle (žánr, literární druh)
2. Časoprostor díla
3. Kompozici a vypravěčskou perspektivu
4. Hlavní postavy a jejich charakteristiku
5. Hlavní témata a motivy
6. Jazykové prostředky a styl
7. Význam díla v kontextu autorovy tvorby`;
  }

  // Add literary context instructions if enabled
  if (preferences.literaryContext) {
    prompt += `

Přidej odstavec o literárním kontextu díla, který zahrnuje:
- Literární období a směr, do kterého dílo patří
- Charakteristické znaky tohoto období/směru v díle
- Srovnání s jinými významnými díly stejného období/žánru
- Historický a společenský kontext vzniku díla`;
  }

  // Add general instructions
  prompt += `

Shrnutí musí být kompletní s jasným závěrem. Při nedostatku tokenů zkrať obsah, ale neukončuj náhle.

${notes ? `Poznámky čtenáře:\n${notes}` : ""}`;

  return prompt;
}

function checkIfSummaryIsCutOff(summary: string): string {
  // Simple check for proper ending
  const lastChar = summary.trim().slice(-1);
  const properEndingPunctuation = [".", "!", "?", '"', ")", "]", "}"].includes(
    lastChar
  );

  // Only check last sentence if ending punctuation is missing
  if (!properEndingPunctuation) {
    const lastSentence = summary.split(/[.!?]/).pop()?.trim() || "";
    const isTooShort = lastSentence.split(" ").length < 3;

    if (isTooShort) {
      return (
        summary +
        "\n\n*Poznámka: Toto shrnutí bylo zkráceno kvůli omezení délky.*\n\n*Pro úplné shrnutí doporučujeme:*\n- Zvolit kratší délku shrnutí\n- Rozdělit poznámky do více knih\n- Ručně zkrátit nejdůležitější poznámky"
      );
    }
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

    // Truncate notes if they're too long to save on input tokens
    let processedNotes = notes;
    if (notes && notes.length > 6000) {
      // If notes are very long, truncate them to save tokens
      // This keeps approximately the first 6000 characters which is enough context
      processedNotes =
        notes.substring(0, 6000) +
        "\n\n[...]\n\nPoznámka: Vaše poznámky byly zkráceny na 6000 znaků pro optimalizaci využití tokenů. Zobrazeny jsou pouze první části poznámek.";
    }

    const prompt = generatePrompt(
      bookTitle,
      bookAuthor,
      processedNotes,
      preferences
    );

    // Set max_tokens based on the length preference
    let maxTokens;
    // Use the same model for all lengths to maintain quality
    const model = "gpt-4o-mini";

    switch (preferences.length) {
      case "short":
        maxTokens = 800;
        break;
      case "medium":
        maxTokens = 1500;
        break;
      case "long":
        maxTokens = 2500;
        break;
      default:
        maxTokens = 1500;
    }

    const response = await openai.chat.completions.create({
      model,
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
