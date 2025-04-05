import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";
import { SummaryPreferences } from "@/components/SummaryPreferencesModal";
import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";

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

Formátuj pomocí markdown. Používej **tučné** pro důležité pojmy, *kurzívu* pro názvy děl.

DŮLEŽITÉ: Vždy dokončuj své myšlenky a zajisti, že text je kompletní. Pokud se blížíš k limitu tokenů, raději zkrať obsah v každé sekci, ale zachovej všechny sekce a zajisti, že shrnutí má jasný závěr. Nikdy neukončuj text uprostřed věty nebo myšlenky.`;

  // Add notes if available (after all instructions to prioritize them)
  if (notes && notes.trim()) {
    prompt += `

Poznámky čtenáře:
${notes}`;
  }

  return prompt;
}

/**
 * Check if a summary appears to be cut off or incomplete
 * @param summary The summary text to check
 * @param bookTitle The title of the book
 * @param author The author of the book
 * @param preferences The summary preferences
 * @returns Fixed summary with a completion notice if needed
 */
function checkIfSummaryIsCutOff(
  summary: string,
  bookTitle: string,
  author: string,
  preferences: SummaryPreferences
): string {
  if (!summary) return summary;

  // Trim whitespace
  const trimmedSummary = summary.trim();

  // Check if summary ends with proper punctuation
  const lastChar = trimmedSummary.slice(-1);
  const properEndingPunctuation = [".", "!", "?", '"', ")", "]", "}"].includes(
    lastChar
  );

  // Check if summary has a reasonable length
  const hasReasonableLength = trimmedSummary.length > 100;

  // Check if summary contains expected sections (for structured summaries)
  const hasExpectedSections = preferences.studyGuide
    ? trimmedSummary.includes("# ") && trimmedSummary.includes("## ")
    : true;

  // Check if summary doesn't end mid-sentence
  const lastSentence = trimmedSummary.split(/[.!?]/).pop() || "";
  const lastSentenceComplete =
    lastSentence.trim().split(/\s+/).length < 4 || properEndingPunctuation;

  // Check if summary doesn't have obvious truncation markers
  const noTruncationMarkers =
    !trimmedSummary.endsWith("...") &&
    !trimmedSummary.endsWith("…") &&
    !trimmedSummary.endsWith("-");

  // If the summary appears incomplete
  if (
    !hasReasonableLength ||
    !hasExpectedSections ||
    !lastSentenceComplete ||
    !noTruncationMarkers
  ) {
    const language = preferences.language === "cs" ? "cs" : "en";

    // Create a notice in the appropriate language
    const notice =
      language === "cs"
        ? `\n\n---\n\n**Poznámka:** Shrnutí knihy "${bookTitle}" (${author}) může být neúplné. Pro získání kompletního shrnutí zkuste:\n\n- Zvolit kratší délku shrnutí\n- Použít méně komplexní nastavení\n- Rozdělit poznámky do více knih\n- Ručně zkrátit nejdůležitější poznámky`
        : `\n\n---\n\n**Note:** The summary of "${bookTitle}" (${author}) may be incomplete. To get a complete summary, try:\n\n- Choosing a shorter summary length\n- Using less complex settings\n- Splitting your notes into multiple books\n- Manually shortening your most important notes`;

    return summary + notice;
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

  // Define absolute maximum token limits to prevent excessive consumption
  const MAX_TOKENS_LIMIT = 4000; // Hard limit for any request
  const SAFE_TOKENS_LIMIT = 3000; // Default safe limit for most cases

  // Select model based on complexity
  let model: string;
  let maxTokens: number;

  if (complexityScore >= 6) {
    // High complexity - use GPT-4o for best quality
    model = "gpt-4o";
    maxTokens =
      preferences.length === "long"
        ? Math.min(3500, MAX_TOKENS_LIMIT)
        : preferences.length === "medium"
        ? Math.min(2500, SAFE_TOKENS_LIMIT)
        : Math.min(1500, SAFE_TOKENS_LIMIT);
  } else if (complexityScore >= 3) {
    // Medium complexity - use GPT-4o-mini for good balance
    model = "gpt-4o-mini";
    maxTokens =
      preferences.length === "long"
        ? Math.min(3000, SAFE_TOKENS_LIMIT)
        : preferences.length === "medium"
        ? Math.min(2000, SAFE_TOKENS_LIMIT)
        : Math.min(1200, SAFE_TOKENS_LIMIT);
  } else {
    // Low complexity - use GPT-3.5 Turbo for efficiency
    model = "gpt-3.5-turbo";
    maxTokens =
      preferences.length === "long"
        ? Math.min(2500, SAFE_TOKENS_LIMIT)
        : preferences.length === "medium"
        ? Math.min(1800, SAFE_TOKENS_LIMIT)
        : Math.min(1000, SAFE_TOKENS_LIMIT);
  }

  // Apply a cost-based adjustment based on model and notes length
  // More expensive models get stricter token limits when notes are short
  const hasSignificantNotes = notesLength > 1000;
  const costAdjustedLimit =
    model === "gpt-4o"
      ? hasSignificantNotes
        ? Math.min(maxTokens, 3500)
        : Math.min(maxTokens, 3000)
      : model === "gpt-4o-mini"
      ? hasSignificantNotes
        ? Math.min(maxTokens, 3800)
        : Math.min(maxTokens, 3200)
      : maxTokens;

  console.log(
    `Selected model: ${model} (complexity score: ${complexityScore}, tokens: ${costAdjustedLimit})`
  );
  return { model, maxTokens: costAdjustedLimit };
}

/**
 * Check if a summary appears to be complete
 * @param summary The summary text to check
 * @returns True if the summary appears complete, false if it seems cut off
 */
function isSummaryComplete(summary: string): boolean {
  if (!summary) return false;

  // Trim whitespace
  const trimmedSummary = summary.trim();

  // Check if summary ends with proper punctuation
  const endsWithProperPunctuation = /[.!?]$/.test(trimmedSummary);

  // Check if summary has a reasonable length
  const hasReasonableLength = trimmedSummary.length > 200;

  // Check if summary contains expected sections or paragraphs
  const hasExpectedStructure =
    trimmedSummary.includes("\n\n") ||
    trimmedSummary.includes("# ") ||
    trimmedSummary.includes("## ");

  // Check if summary doesn't end mid-sentence
  const lastSentence = trimmedSummary.split(/[.!?]/).pop() || "";
  const lastSentenceComplete =
    lastSentence.trim().split(/\s+/).length < 4 || endsWithProperPunctuation;

  // Check if summary doesn't have obvious truncation markers
  const noTruncationMarkers =
    !trimmedSummary.endsWith("...") &&
    !trimmedSummary.endsWith("…") &&
    !trimmedSummary.endsWith("-");

  return (
    hasReasonableLength &&
    hasExpectedStructure &&
    lastSentenceComplete &&
    noTruncationMarkers
  );
}

export async function POST(request: Request) {
  console.log("=== GENERATE SUMMARY API ROUTE CALLED ===");

  try {
    // Get the request body
    const body = await request.json();
    const {
      bookTitle,
      bookAuthor,
      notes,
      preferences = {
        style: "academic",
        length: "medium",
        focus: "balanced",
        language: "cs",
        examFocus: false,
        literaryContext: false,
        studyGuide: false,
      },
      clientSideDeduction = false,
    } = body;

    // Validate inputs
    if (!bookTitle || !bookAuthor) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "Chybí povinné parametry" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if the user is authenticated and has AI credits
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized: No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription requirements - verify AI credits
    const subscriptionCheck = await checkSubscription(
      request as unknown as NextRequest,
      {
        requireAiCredits: true,
      }
    );

    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.response as NextResponse;
    }

    const user = subscriptionCheck.user;

    if (!user) {
      console.log("User not found in subscription check");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Request received:", {
      bookTitle,
      bookAuthor,
      notesLength: notes?.length || 0,
      preferences,
    });

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

    // Try up to 3 times with different settings if needed
    let attempts = 0;
    const maxAttempts = 3;
    let currentPreferences = { ...preferences };
    let summary = "";

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts} for book summary`);

      // Adjust strategy based on attempt number
      if (attempts === 2) {
        // On second attempt, simplify but keep length
        console.log("Simplifying features for retry attempt");
        currentPreferences = {
          ...currentPreferences,
          // Remove additional features but keep length
          examFocus: false,
          literaryContext: false,
        };
      } else if (attempts === 3) {
        // On third attempt, reduce length and further simplify
        console.log(
          "Reducing length and further simplifying for final attempt"
        );
        currentPreferences = {
          ...currentPreferences,
          length: "short",
          style: "casual", // Simpler style
          studyGuide: false, // Remove study guide formatting
        };
      }

      console.log("Generating prompt...");
      const prompt = generatePrompt(
        bookTitle,
        bookAuthor,
        processedNotes,
        currentPreferences
      );
      console.log("Prompt generated, length:", prompt.length);

      // Select optimal model based on request complexity
      const { model, maxTokens } = selectOptimalModel(
        currentPreferences,
        processedNotes?.length || 0
      );

      // On retry attempts, increase token limit to ensure completion
      const attemptAdjustedMaxTokens =
        attempts > 1
          ? Math.min(maxTokens + (attempts - 1) * 500, 4000) // Increase by 500 tokens per retry, up to 4000
          : maxTokens;

      console.log(
        `Using model: ${model} with max tokens: ${attemptAdjustedMaxTokens}`
      );

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
          temperature: currentPreferences.style === "creative" ? 0.8 : 0.6,
          max_tokens: attemptAdjustedMaxTokens,
          frequency_penalty: 0.1, // Slight penalty to avoid repetition
          presence_penalty: 0.1, // Slight penalty to encourage covering new topics
        });

        console.log("OpenAI API response received");

        const currentSummary = response.choices[0]?.message?.content;

        if (!currentSummary) {
          console.log("No summary content in OpenAI response");
          if (attempts >= maxAttempts) {
            throw new Error("Nepodařilo se získat odpověď z OpenAI API");
          }
          console.log("Retrying with simpler settings...");
          continue;
        }

        console.log("Summary received, length:", currentSummary.length);

        // Check if the summary appears complete
        const isComplete = isSummaryComplete(currentSummary);

        if (isComplete || attempts >= maxAttempts) {
          // Either the summary is complete or we've reached max attempts
          summary = currentSummary;
          break;
        }

        console.log(
          "Summary appears incomplete, retrying with adjusted settings..."
        );
      } catch (openaiError: unknown) {
        console.error("OpenAI API error:", openaiError);
        if (attempts >= maxAttempts) {
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
        console.log("Retrying with simpler settings after error...");
      }
    }

    // Check if the summary appears to be cut off
    const processedSummary = checkIfSummaryIsCutOff(
      summary,
      bookTitle,
      bookAuthor,
      preferences
    );

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

    // After successful generation, only deduct one AI credit if not already deducted on client side
    try {
      // Skip the credit deduction if already done on the client side
      let remainingCredits = user.subscription?.aiCreditsRemaining;

      if (!clientSideDeduction && user) {
        remainingCredits = await user.useAiCredit();
        console.log(`AI credit used. Remaining credits: ${remainingCredits}`);
      } else {
        console.log(
          "Credit already deducted on client side, skipping server deduction"
        );
      }

      // Return the summary and remaining credits
      return NextResponse.json({
        summary: processedSummary,
        fromCache: false,
        creditsRemaining: remainingCredits,
        creditsTotal: user.subscription?.aiCreditsTotal,
      });
    } catch (creditError) {
      console.error("Error deducting AI credit:", creditError);
      return NextResponse.json(
        {
          error: "Došly vám AI kredity",
          creditsRequired: true,
          creditsRemaining: user.subscription?.aiCreditsRemaining || 0,
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Chyba při generování shrnutí",
      },
      { status: 500 }
    );
  }
}
