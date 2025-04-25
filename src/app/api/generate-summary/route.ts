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

// Instantiate Redis client using the correct environment variable names
let redis: Redis | null = null;
const kvUrl = process.env.KV_REST_API_URL; // Use KV_REST_API_URL
const kvToken = process.env.KV_REST_API_TOKEN; // Use KV_REST_API_TOKEN

if (kvUrl && kvToken) {
  redis = new Redis({
    url: kvUrl,
    token: kvToken,
  });
  console.log(
    "Redis client initialized successfully using KV_REST_API variables."
  );
} else {
  console.warn(
    "KV_REST_API_URL or KV_REST_API_TOKEN environment variables are missing. Redis caching will be disabled."
  );
}

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
  // Force gpt-4o-mini for faster processing within timeout limits
  const model = "gpt-4o-mini";

  // Define slightly reduced maximum token limits for gpt-4o-mini
  const MAX_TOKENS_LIMIT = 3800; // Keep a buffer from absolute limits
  const SAFE_TOKENS_LIMIT = 3400; // Slightly reduced safe limit

  let maxTokens: number;

  // Select maxTokens based on desired length, slightly reduced
  switch (preferences.length) {
    case "long":
      maxTokens = Math.min(3300, MAX_TOKENS_LIMIT); // Reduced from 3500
      break;
    case "medium":
      maxTokens = Math.min(2300, SAFE_TOKENS_LIMIT); // Reduced from 2500
      break;
    case "short":
    default:
      maxTokens = Math.min(1350, SAFE_TOKENS_LIMIT); // Reduced from 1500
      break;
  }

  // Apply a small boost if significant notes are present
  const hasSignificantNotes = notesLength > 1000;
  const costAdjustedLimit = hasSignificantNotes
    ? Math.min(maxTokens + 200, MAX_TOKENS_LIMIT) // Slightly smaller boost
    : maxTokens;

  // Removed complexity score logic as we force gpt-4o-mini

  console.log(
    `Selected model: ${model} (forced mini, tokens: ${costAdjustedLimit})`
  );
  return { model, maxTokens: costAdjustedLimit };
}

// Remove isSummaryComplete function
/*
function isSummaryComplete(...) { ... }
*/

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log(`[${startTime}] === GENERATE SUMMARY API START ===`);

  try {
    // Get the request body
    console.log(`[${Date.now()}] Parsing request body...`);
    const body = await request.json();
    console.log(`[${Date.now()}] Request body parsed.`);
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
      console.log(`[${Date.now()}] Missing required parameters`);
      return NextResponse.json(
        { error: "Chybí povinné parametry" },
        { status: 400 }
      );
    }

    // Connect to database - Note: Remove if MongoDB is not used for saving summaries here
    console.log(`[${Date.now()}] Connecting to DB...`);
    await dbConnect();
    console.log(`[${Date.now()}] DB Connected.`);

    // Check if the user is authenticated and has AI credits
    console.log(`[${Date.now()}] Checking session...`);
    const session = await getServerSession(authOptions);
    console.log(`[${Date.now()}] Session checked.`);
    if (!session?.user) {
      console.log(`[${Date.now()}] Unauthorized: No user session found`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription requirements - verify AI credits
    console.log(`[${Date.now()}] Checking subscription...`);
    const subscriptionCheck = await checkSubscription(
      request as unknown as NextRequest,
      {
        requireAiCredits: true,
      }
    );
    console.log(`[${Date.now()}] Subscription checked.`);

    if (!subscriptionCheck.allowed) {
      console.log(`[${Date.now()}] Subscription check failed.`);
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

    // --- Cache Check --- (Only if no user notes and Redis is configured)
    if (!hasUserNotes && redis) {
      // Check if redis client was initialized
      cacheKey = generateCacheKey(bookTitle, bookAuthor, preferences);
      console.log(`[${Date.now()}] Checking cache with key: ${cacheKey}`);
      try {
        const cachedSummary = await redis.get<string>(cacheKey);
        if (cachedSummary != null) {
          console.log(`[${Date.now()}] Cache hit! Returning cached summary.`);
          const endTime = Date.now();
          console.log(
            `[${endTime}] API Route Total Time (Cache Hit): ${endTime - startTime}ms`
          );
          return new Response(formatDataStreamPart("text", cachedSummary), {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
        console.log(`[${Date.now()}] Cache miss.`);
      } catch (cacheError) {
        console.error(`[${Date.now()}] Redis cache read error:`, cacheError);
        // Continue without cache if Redis fails
      }
    } else if (!hasUserNotes) {
      console.log(
        `[${Date.now()}] Redis not configured or notes present, skipping cache check.`
      );
    }
    // --- End Cache Check ---

    // Use intelligent truncation for notes
    let processedNotes = notes;
    if (notes && notes.length > 6000) {
      console.log(`[${Date.now()}] Starting notes truncation...`);
      processedNotes = intelligentlyTruncateNotes(notes, 6000);
      console.log(
        `[${Date.now()}] Notes intelligently truncated from`,
        notes.length,
        "to",
        processedNotes.length,
        "characters"
      );
    }

    console.log(`[${Date.now()}] Generating prompt...`);
    const prompt = generatePrompt(
      bookTitle,
      bookAuthor,
      processedNotes,
      preferences // Use original preferences, no retry adjustments
    );
    console.log(`[${Date.now()}] Prompt generated, length:`, prompt.length);

    // Select optimal model based on original request complexity
    console.log(`[${Date.now()}] Selecting model...`);
    const { model, maxTokens } = selectOptimalModel(
      preferences,
      processedNotes?.length || 0
    );
    console.log(
      `[${Date.now()}] Model selected: ${model}, max_tokens: ${maxTokens}`
    );

    console.log(`[${Date.now()}] Calling AI SDK streamText...`);
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
        const finishTime = Date.now();
        console.log(
          `[${finishTime}] AI stream finished. Total stream time: ${finishTime - startTime}ms`
        ); // Log time when stream finishes
        // Only cache if cacheKey was generated and Redis is configured
        if (cacheKey && redis) {
          // Check redis again
          console.log(
            `[${finishTime}] Attempting to cache result for key: ${cacheKey}`
          );
          try {
            await redis.set(cacheKey, text, {
              ex: CACHE_EXPIRATION_SECONDS,
            });
            console.log(`[${Date.now()}] Summary cached successfully.`);
          } catch (cacheError) {
            console.error(
              `[${Date.now()}] Redis cache write error:`,
              cacheError
            );
          }
        } else {
          console.log(
            `[${finishTime}] Caching skipped (no cache key or Redis unavailable).`
          );
        }
        // --- Add Credit Deduction within onFinish for reliability ---
        console.log(
          `[${Date.now()}] Attempting credit deduction post-generation...`
        );
        try {
          if (!clientSideDeduction && user) {
            await user.useAiCredit(); // Await the deduction here
            console.log(`[${Date.now()}] AI credit deducted successfully.`);
            // Optionally log remaining credits if the method returns it
          } else {
            console.log(
              `[${Date.now()}] Credit deduction skipped (client-side or no user).`
            );
          }
        } catch (creditError) {
          console.error(
            `[${Date.now()}] Error during AI credit deduction in onFinish:`,
            creditError
          );
        }
        // --- End Credit Deduction in onFinish ---
      },
      // --- End Cache Saving ---
    });

    console.log(`[${Date.now()}] AI SDK stream initiated, returning response.`);

    // Respond with the stream using the AI SDK helper
    const streamResponse = result.toDataStreamResponse();
    const finalEndTime = Date.now();
    console.log(
      `[${finalEndTime}] API Route Total Time (Stream Response): ${finalEndTime - startTime}ms`
    ); // Log total time before returning stream
    return streamResponse;

    // Remove old response logic (NextResponse.json)
    /*
    const processedSummary = checkIfSummaryIsCutOff(...)
    if (!notes || notes.trim() === "") { ... } // Cache saving removed
    ... // Credit deduction logic moved up
    return NextResponse.json({ ... });
    */
  } catch (error) {
    const errorTime = Date.now();
    console.error(`[${errorTime}] Error generating summary stream:`, error);
    const totalTime = errorTime - startTime;
    console.log(`[${errorTime}] API Route Total Time (Error): ${totalTime}ms`);

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
