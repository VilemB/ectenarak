import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SummaryPreferences } from "@/components/SummaryPreferencesModal";
import { createHash } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache for summaries
// In a production environment, this should be replaced with Redis or another persistent cache
interface CacheEntry {
  summary: string;
  timestamp: number;
  preferences: SummaryPreferences;
}

const summaryCache: Record<string, CacheEntry> = {};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Generate a cache key based on book details and preferences
 * @param bookTitle Book title
 * @param author Book author
 * @param preferences Summary preferences
 * @returns Cache key string
 */
function generateCacheKey(
  bookTitle: string,
  author: string,
  preferences: SummaryPreferences
): string {
  // Create a simplified version of preferences for the cache key
  // We don't need to include all details, just the ones that significantly affect the output
  const simplifiedPrefs = {
    style: preferences.style,
    length: preferences.length,
    focus: preferences.focus,
    language: preferences.language,
    hasExamFocus: preferences.examFocus,
    hasLiteraryContext: preferences.literaryContext,
    hasStudyGuide: preferences.studyGuide,
  };

  // Create a string to hash
  const stringToHash = `${bookTitle}|${author}|${JSON.stringify(
    simplifiedPrefs
  )}`;

  // Generate a hash for the cache key
  return createHash("md5").update(stringToHash).digest("hex");
}

function generatePrompt(
  bookTitle: string,
  author: string,
  notes: string | undefined,
  preferences: SummaryPreferences
) {
  // Define style characteristics more specifically
  const styleMap = {
    academic: {
      label: "akademický",
      instruction:
        "Používej odbornou terminologii, analyzuj dílo kriticky, cituj literární teorie kde je to vhodné.",
    },
    casual: {
      label: "neformální",
      instruction:
        "Piš přístupným jazykem, vyhni se složitým termínům, používej přirozený tón jako při konverzaci.",
    },
    creative: {
      label: "kreativní",
      instruction:
        "Používej barvitý jazyk, metafory a přirovnání, buď originální v interpretaci.",
    },
  };

  // Define focus areas more specifically
  const focusMap = {
    plot: {
      label: "děj",
      instruction:
        "Věnuj 70% obsahu popisu děje, zápletky a struktury vyprávění.",
    },
    characters: {
      label: "postavy",
      instruction:
        "Věnuj 70% obsahu analýze postav, jejich motivací, vývoje a vzájemných vztahů.",
    },
    themes: {
      label: "témata",
      instruction:
        "Věnuj 70% obsahu rozboru hlavních témat, symboliky a motivů díla.",
    },
    balanced: {
      label: "vyvážený obsah",
      instruction: "Pokryj rovnoměrně děj, postavy i témata díla.",
    },
  };

  // Length with specific word count targets
  const lengthMap = {
    short: "150-200 slov",
    medium: "300-400 slov",
    long: "500-700 slov",
  };

  const language = preferences.language === "cs" ? "česky" : "anglicky";

  // Build a more directive but still concise base prompt
  let prompt = `Shrnutí knihy "${bookTitle}" (${author}). `;

  // Add style instruction
  prompt += `Styl: ${styleMap[preferences.style].label}. ${
    styleMap[preferences.style].instruction
  } `;

  // Add focus instruction
  prompt += `Zaměření: ${focusMap[preferences.focus].label}. ${
    focusMap[preferences.focus].instruction
  } `;

  // Add length and language
  prompt += `Délka: ${lengthMap[preferences.length]}. Jazyk: ${language}.`;

  // Add minimal instructions for when no notes are provided
  if (!notes || notes.trim() === "") {
    prompt += ` Vycházej z obecných znalostí o knize nebo vytvoř pravděpodobný obsah.`;
  }

  // Add structure template based on preferences
  // Use a more compact format for study guide
  if (preferences.studyGuide) {
    prompt += `

Struktura (použij markdown):
# ${bookTitle} - ${author}
## Základní informace
- Žánr, druh, forma, rok, směr
## Děj a kompozice
- Časoprostor, kompozice, vypravěč, stručný děj
## Postavy
- Hlavní a vedlejší postavy, vztahy
## Témata a motivy
- Hlavní témata, motivy, symbolika
## Jazykové prostředky
- Jazyk, styl, typické prostředky
## Kontext a význam
- Literární kontext, význam díla
## Studijní poznámky
- Důležité body, interpretace, tipy`;
  }

  // Add exam focus in a more compact format
  if (preferences.examFocus) {
    prompt += `

${
  preferences.studyGuide ? "## Maturitní příprava" : "Zahrň sekci pro maturitu:"
}
- Zařazení k maturitě, argumentace, typické otázky, doporučené souvislosti`;
  }

  // Add literary context in a more compact format
  if (preferences.literaryContext) {
    prompt += `

${
  preferences.studyGuide
    ? "## Rozšířený literární kontext"
    : "Zahrň sekci o literárním kontextu:"
}
- Charakteristika období/směru, historické souvislosti, autor v kontextu, vliv`;
  }

  // Add formatting instructions in a more compact way
  prompt += `

Formátuj pomocí markdown. Používej **tučné** pro důležité pojmy, *kurzívu* pro názvy děl.`;

  // Add notes if available (after all instructions to prioritize them)
  if (notes && notes.trim()) {
    prompt += `

Poznámky čtenáře:
${notes}`;
  }

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

/**
 * Intelligently truncate notes to optimize token usage while preserving important information
 * @param notes The original notes text
 * @param maxChars Maximum character limit (approximate)
 * @returns Processed notes with important information preserved
 */
function intelligentlyTruncateNotes(
  notes: string,
  maxChars: number = 6000
): string {
  if (!notes || notes.length <= maxChars) return notes;

  // Split notes into paragraphs
  const paragraphs = notes.split(/\n\n+/);

  // If we have very few paragraphs, just truncate normally
  if (paragraphs.length <= 3) {
    return (
      notes.substring(0, maxChars) +
      "\n\n[...]\n\nPoznámka: Vaše poznámky byly zkráceny pro optimalizaci využití tokenů."
    );
  }

  // Identify potentially important paragraphs
  const scoredParagraphs = paragraphs.map((para, index) => {
    // Calculate importance score based on various factors
    let score = 0;

    // Earlier paragraphs are often more important (introduction, context)
    score += Math.max(0, 10 - index);

    // Paragraphs with keywords are likely important
    const importantKeywords = [
      "hlavní",
      "důležité",
      "klíčové",
      "téma",
      "motiv",
      "postava",
      "děj",
      "závěr",
      "shrnutí",
      "symbolika",
      "význam",
      "analýza",
    ];

    importantKeywords.forEach((keyword) => {
      if (para.toLowerCase().includes(keyword.toLowerCase())) {
        score += 5;
      }
    });

    // Longer paragraphs might contain more information
    score += Math.min(5, para.length / 100);

    // Paragraphs with formatting might be structured important points
    if (para.includes("- ") || para.includes("* ") || /\d+\./.test(para)) {
      score += 5;
    }

    return { text: para, score, index };
  });

  // Sort paragraphs by importance score (descending)
  scoredParagraphs.sort((a, b) => b.score - a.score);

  // Take the most important paragraphs up to the character limit
  let result = "";
  let currentLength = 0;

  // Always include the first paragraph (likely introduction)
  const firstPara = paragraphs[0];
  result += firstPara + "\n\n";
  currentLength += firstPara.length + 2;

  // Add high-scoring paragraphs until we approach the limit
  for (const para of scoredParagraphs) {
    // Skip the first paragraph as we've already included it
    if (para.index === 0) continue;

    // Check if adding this paragraph would exceed our limit
    if (currentLength + para.text.length + 2 > maxChars - 100) {
      // We're approaching the limit, stop adding paragraphs
      break;
    }

    result += para.text + "\n\n";
    currentLength += para.text.length + 2;
  }

  // Add a note about truncation
  result +=
    "[...]\n\nPoznámka: Vaše poznámky byly inteligentně zkráceny pro optimalizaci využití tokenů. Zobrazeny jsou nejdůležitější části.";

  return result;
}

/**
 * Select the most appropriate model based on request complexity
 * @param preferences User preferences for the summary
 * @param notesLength Length of user notes (if any)
 * @returns Object with selected model and max tokens
 */
function selectOptimalModel(
  preferences: SummaryPreferences,
  notesLength: number = 0
): { model: string; maxTokens: number } {
  // Base complexity score starts at 0
  let complexityScore = 0;

  // Add complexity based on preferences
  if (preferences.studyGuide) complexityScore += 3;
  if (preferences.examFocus) complexityScore += 2;
  if (preferences.literaryContext) complexityScore += 2;
  if (preferences.style === "academic") complexityScore += 1;
  if (preferences.length === "long") complexityScore += 2;

  // Add complexity based on notes length
  if (notesLength > 3000) complexityScore += 2;
  else if (notesLength > 1000) complexityScore += 1;

  // Select model based on complexity
  let model: string;
  let maxTokens: number;

  if (complexityScore >= 6) {
    // High complexity - use GPT-4o for best quality
    model = "gpt-4o";
    maxTokens =
      preferences.length === "long"
        ? 3000
        : preferences.length === "medium"
        ? 2000
        : 1000;
  } else if (complexityScore >= 3) {
    // Medium complexity - use GPT-4o-mini for good balance
    model = "gpt-4o-mini";
    maxTokens =
      preferences.length === "long"
        ? 2500
        : preferences.length === "medium"
        ? 1500
        : 800;
  } else {
    // Low complexity - use GPT-3.5 Turbo for efficiency
    model = "gpt-3.5-turbo";
    maxTokens =
      preferences.length === "long"
        ? 2000
        : preferences.length === "medium"
        ? 1200
        : 600;
  }

  console.log(
    `Selected model: ${model} (complexity score: ${complexityScore})`
  );
  return { model, maxTokens };
}

export async function POST(request: Request) {
  console.log("=== GENERATE SUMMARY API ROUTE CALLED ===");

  try {
    const body = await request.json();
    const { bookTitle, bookAuthor, notes, preferences } = body;

    console.log("Request received:", {
      bookTitle,
      bookAuthor,
      notesLength: notes?.length || 0,
      preferences,
    });

    if (!bookTitle || !bookAuthor || !preferences) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "Chybí povinné parametry" },
        { status: 400 }
      );
    }

    // Check cache first if no user notes are provided
    // We only cache summaries that don't depend on user notes
    if (!notes || notes.trim() === "") {
      const cacheKey = generateCacheKey(bookTitle, bookAuthor, preferences);
      const cachedEntry = summaryCache[cacheKey];

      // Check if we have a valid cache entry
      if (
        cachedEntry &&
        Date.now() - cachedEntry.timestamp < CACHE_EXPIRATION
      ) {
        console.log("Cache hit! Returning cached summary");
        return NextResponse.json({
          summary: cachedEntry.summary,
          fromCache: true,
        });
      }

      console.log("Cache miss or expired entry");
    }

    // Use intelligent truncation for notes to preserve important information
    let processedNotes = notes;
    if (notes && notes.length > 6000) {
      processedNotes = intelligentlyTruncateNotes(notes, 6000);
      console.log(
        "Notes intelligently truncated from",
        notes.length,
        "to",
        processedNotes.length,
        "characters"
      );
    }

    console.log("Generating prompt...");
    const prompt = generatePrompt(
      bookTitle,
      bookAuthor,
      processedNotes,
      preferences
    );
    console.log("Prompt generated, length:", prompt.length);

    // Select optimal model based on request complexity
    const { model, maxTokens } = selectOptimalModel(
      preferences,
      processedNotes?.length || 0
    );
    console.log("Using model:", model, "with max tokens:", maxTokens);

    console.log("Calling OpenAI API...");

    try {
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

      console.log("OpenAI API response received");

      const summary = response.choices[0]?.message?.content;

      if (!summary) {
        console.log("No summary content in OpenAI response");
        throw new Error("Nepodařilo se získat odpověď z OpenAI API");
      }

      console.log("Summary received, length:", summary.length);

      // Check if the summary appears to be cut off
      const processedSummary = checkIfSummaryIsCutOff(summary);

      // Cache the summary if no user notes were provided
      if (!notes || notes.trim() === "") {
        const cacheKey = generateCacheKey(bookTitle, bookAuthor, preferences);
        summaryCache[cacheKey] = {
          summary: processedSummary,
          timestamp: Date.now(),
          preferences,
        };
        console.log("Summary cached with key:", cacheKey);
      }

      console.log("=== GENERATE SUMMARY API ROUTE SUCCESS ===");
      return NextResponse.json({
        summary: processedSummary,
        fromCache: false,
      });
    } catch (openaiError: unknown) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        {
          error:
            "Chyba při volání OpenAI API: " +
            (openaiError instanceof Error
              ? openaiError.message
              : "Neznámá chyba"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat shrnutí" },
      { status: 500 }
    );
  }
}
