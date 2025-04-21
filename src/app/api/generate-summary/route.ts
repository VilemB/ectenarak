import { NextResponse, NextRequest } from "next/server";
// Keep OpenAI for error type checking if needed, but provider comes from @ai-sdk/openai
import OpenAI from "openai";
import { SummaryPreferences } from "@/components/SummaryPreferencesModal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";
// Import Vercel AI SDK components
import { streamText, formatDataStreamPart } from "ai"; // Core function for streaming text
import { openai as openaiProvider } from "@ai-sdk/openai"; // OpenAI provider
import { Redis } from "@upstash/redis"; // Import Redis client
import { createHash } from "crypto"; // Import crypto for cache key generation

// Instantiate Redis client using environment variables
const redis = new Redis({
  url: process.env.KV_URL!,
  token: process.env.KV_TOKEN!,
});

// Cache expiration time (e.g., 24 hours in seconds)
const CACHE_EXPIRATION_SECONDS = 24 * 60 * 60;

// Re-introduce cache key generation function
function generateCacheKey(
  bookTitle: string,
  author: string,
  preferences: SummaryPreferences
): string {
  const simplifiedPrefs = {
    style: preferences.style,
    length: preferences.length,
    focus: preferences.focus,
    language: preferences.language,
    hasExamFocus: preferences.examFocus,
    hasLiteraryContext: preferences.literaryContext,
    hasStudyGuide: preferences.studyGuide,
  };
  const stringToHash = `${bookTitle}|${author}|${JSON.stringify(
    simplifiedPrefs
  )}`;
  return `summary:${createHash("md5").update(stringToHash).digest("hex")}`;
}

// Remove the direct OpenAI client instantiation if only used for the API call
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Remove Edge runtime configuration to allow Node.js APIs like 'crypto' (used by next-auth)
// export const runtime = "edge";

// Remove in-memory cache related code as it's not directly compatible with streaming
/*
interface CacheEntry { ... }
const summaryCache: Record<string, CacheEntry> = {};
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;
function generateCacheKey(...) { ... }
*/

// Keep generatePrompt, intelligentlyTruncateNotes, selectOptimalModel for now
// ... existing code ...
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
      instruction: `Používej:
- Odbornou literárněvědnou terminologii
- Citace z odborných zdrojů a kritických prací
- Formální, objektivní jazyk
- Analytický a kritický přístup
- Přesné datace a bibliografické údaje
Vyhýbej se:
- Subjektivním hodnocením
- Neformálnímu jazyku
- Anekdotám bez kontextu`,
    },
    casual: {
      label: "neformální",
      instruction: `Používej:
- Srozumitelný, každodenní jazyk
- Přátelský, konverzační tón
- Praktické příklady a přirovnání
- Osobní perspektivu
- Zajímavé detaily a souvislosti
Vyhýbej se:
- Odborné terminologii
- Složitým souvětím
- Suchým faktům bez kontextu`,
    },
    creative: {
      label: "kreativní",
      instruction: `Používej:
- Barvitý, expresivní jazyk
- Metafory a přirovnání
- Dramatické prvky a napětí
- Osobní příběhy a anekdoty
- Neotřelé úhly pohledu
Vyhýbej se:
- Suchému akademickému stylu
- Strohému výčtu faktů
- Přílišné formálnosti`,
    },
  };

  // Define focus areas more specifically
  const focusMap = {
    plot: {
      label: "děj",
      instruction: `Rozložení obsahu:
- 70% děj a struktura vyprávění
- 20% literární prostředky a styl
- 10% kontext a interpretace
Zaměř se na:
- Klíčové dějové momenty
- Strukturu vyprávění
- Narativní techniky
- Časoprostor díla`,
    },
    characters: {
      label: "postavy",
      instruction: `Rozložení obsahu:
- 70% charakteristika a vývoj postav
- 20% vztahy mezi postavami
- 10% symbolika postav
Zaměř se na:
- Hlavní a vedlejší postavy
- Psychologický vývoj
- Motivace a konflikty
- Vzájemné vztahy`,
    },
    themes: {
      label: "témata",
      instruction: `Rozložení obsahu:
- 70% témata a motivy
- 20% symbolika a významy
- 10% společenský kontext
Zaměř se na:
- Hlavní témata díla
- Symbolickou rovinu
- Filozofické přesahy
- Společenskou relevanci`,
    },
    balanced: {
      label: "vyvážený obsah",
      instruction: `Rozložení obsahu:
- 33% děj a struktura
- 33% postavy a jejich vývoj
- 33% témata a významy
Zaměř se na:
- Propojení všech rovin díla
- Vzájemné souvislosti
- Celkové vyznění díla`,
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

// Remove checkIfSummaryIsCutOff function
/*
function checkIfSummaryIsCutOff(...) { ... }
*/

// Keep intelligentlyTruncateNotes
// ... existing code ...
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

// Keep selectOptimalModel
// ... existing code ...
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
  } else {
    // Use GPT-4o-mini for all other cases
    model = "gpt-4o-mini";
    maxTokens =
      preferences.length === "long"
        ? Math.min(3000, SAFE_TOKENS_LIMIT)
        : preferences.length === "medium"
          ? Math.min(2000, SAFE_TOKENS_LIMIT)
          : Math.min(1200, SAFE_TOKENS_LIMIT);
  }

  // Apply a cost-based adjustment based on notes length
  const hasSignificantNotes = notesLength > 1000;
  const costAdjustedLimit = hasSignificantNotes
    ? maxTokens
    : Math.min(maxTokens, model === "gpt-4o" ? 3000 : 2500);

  console.log(
    `Selected model: ${model} (complexity score: ${complexityScore}, tokens: ${costAdjustedLimit})`
  );
  return { model, maxTokens: costAdjustedLimit };
}

// Remove isSummaryComplete function
/*
function isSummaryComplete(...) { ... }
*/

export async function POST(request: Request) {
  console.log("=== GENERATE SUMMARY API ROUTE CALLED (STREAMING + CACHE) ===");

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

    const hasUserNotes = notes && notes.trim() !== "";
    let cacheKey: string | null = null;

    // --- Cache Check --- (Only if no user notes are provided)
    if (!hasUserNotes) {
      cacheKey = generateCacheKey(bookTitle, bookAuthor, preferences);
      console.log(`Checking cache with key: ${cacheKey}`);
      try {
        const cachedSummary = await redis.get<string>(cacheKey);
        if (cachedSummary != null) {
          console.log("Cache hit! Returning cached summary.");
          // Return the cached text, formatted as a stream part
          // Use Response directly as StreamingTextResponse might not be ideal for single chunk
          return new Response(formatDataStreamPart("text", cachedSummary), {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" }, // Use text/plain for Vercel AI SDK data stream format
          });
        }
        console.log("Cache miss.");
      } catch (cacheError) {
        console.error("Redis cache read error:", cacheError);
        // Continue without cache if Redis fails
      }
    }
    // --- End Cache Check ---

    // Use intelligent truncation for notes
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

    // Remove retry logic
    // let attempts = 0; ... while (attempts < maxAttempts) { ... }

    console.log(`Generating prompt for single attempt`);
    const prompt = generatePrompt(
      bookTitle,
      bookAuthor,
      processedNotes,
      preferences // Use original preferences, no retry adjustments
    );
    console.log("Prompt generated, length:", prompt.length);

    // Select optimal model based on original request complexity
    const { model, maxTokens } = selectOptimalModel(
      preferences,
      processedNotes?.length || 0
    );
    console.log(`Using model: ${model} with max tokens: ${maxTokens}`);

    console.log("Calling AI SDK streamText...");

    // Use streamText from the AI SDK
    const result = await streamText({
      // Use the imported provider. It should pick up the API key from process.env.OPENAI_API_KEY
      model: openaiProvider(model),
      messages: [{ role: "system", content: prompt }],
      temperature: preferences.style === "creative" ? 0.8 : 0.6,
      maxTokens: maxTokens,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      // --- Cache Saving --- (Add onFinish callback)
      async onFinish({ text }) {
        // Only cache if cacheKey was generated (meaning no user notes)
        if (cacheKey) {
          console.log(`Attempting to cache result for key: ${cacheKey}`);
          try {
            await redis.set(cacheKey, text, {
              ex: CACHE_EXPIRATION_SECONDS,
            });
            console.log("Summary cached successfully.");
          } catch (cacheError) {
            console.error("Redis cache write error:", cacheError);
            // Failed to cache, but proceed anyway
          }
        }
      },
      // --- End Cache Saving ---
    });

    console.log("AI SDK stream initiated");

    // Deduct credit *after* initiating the stream (optimistic approach)
    // Note: Consider using onFinish callback from streamText for more robust credit deduction
    try {
      if (!clientSideDeduction && user) {
        user
          .useAiCredit()
          .then((remainingCredits) => {
            console.log(
              `AI credit deducted asynchronously. Remaining credits: ${remainingCredits}`
            );
          })
          .catch((creditError) => {
            console.error("Async AI credit deduction error:", creditError);
          });
      } else {
        console.log(
          "Credit already deducted on client side or no user, skipping server deduction"
        );
      }
    } catch (creditError) {
      console.error("Error setting up AI credit deduction:", creditError);
    }

    // Respond with the stream using the AI SDK helper
    return result.toDataStreamResponse();

    // Remove old response logic (NextResponse.json)
    /*
    const processedSummary = checkIfSummaryIsCutOff(...)
    if (!notes || notes.trim() === "") { ... } // Cache saving removed
    ... // Credit deduction logic moved up
    return NextResponse.json({ ... });
    */
  } catch (error) {
    console.error("Error generating summary stream:", error);

    // Handle potential OpenAI API errors (check if the type still matches or adjust)
    // The error structure might change slightly with the AI SDK
    if (error instanceof OpenAI.APIError) {
      // Keep this check or adapt based on errors seen with AI SDK
      return NextResponse.json(
        {
          error: `OpenAI API Error: ${error.status} ${error.name}`,
          details: error.message,
        },
        { status: error.status || 500 }
      );
    }

    // Generic error response
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
