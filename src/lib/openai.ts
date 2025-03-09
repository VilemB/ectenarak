import { OpenAI } from "openai";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";
import { createHash } from "crypto";

// Default preferences for author summaries
export const DEFAULT_AUTHOR_PREFERENCES: AuthorSummaryPreferences = {
  style: "academic",
  length: "medium",
  focus: "balanced",
  language: "cs",
  includeTimeline: false,
  includeAwards: false,
  includeInfluences: false,
  studyGuide: false,
};

// Simple in-memory cache for author summaries
interface AuthorCacheEntry {
  summary: string;
  timestamp: number;
  preferences: AuthorSummaryPreferences;
}

const authorSummaryCache: Record<string, AuthorCacheEntry> = {};

// Cache expiration time (7 days in milliseconds)
const AUTHOR_CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a cache key for author summaries
 * @param author Author name
 * @param preferences Summary preferences
 * @returns Cache key string
 */
function generateAuthorCacheKey(
  author: string,
  preferences: AuthorSummaryPreferences
): string {
  // Create a simplified version of preferences for the cache key
  const simplifiedPrefs = {
    style: preferences.style,
    length: preferences.length,
    focus: preferences.focus,
    language: preferences.language,
    hasTimeline: preferences.includeTimeline,
    hasAwards: preferences.includeAwards,
    hasInfluences: preferences.includeInfluences,
    hasStudyGuide: preferences.studyGuide,
  };

  // Create a string to hash
  const stringToHash = `${author}|${JSON.stringify(simplifiedPrefs)}`;

  // Generate a hash for the cache key
  return createHash("md5").update(stringToHash).digest("hex");
}

/**
 * Initialize OpenAI client with proper error handling
 * @returns OpenAI client instance
 * @throws Error if API key is not configured
 */
export const getOpenAIClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error("Error creating OpenAI client:", error);
    throw new Error("Failed to initialize OpenAI client");
  }
};

/**
 * Estimate token count more accurately for different languages
 * @param text Text to estimate tokens for
 * @returns Estimated token count
 */
export const estimateTokenCount = (text: string): number => {
  if (!text) return 0;

  // Different languages have different token densities
  // These are approximate values based on OpenAI's tokenization patterns
  const isCzech = /[ěščřžýáíéúůťďň]/i.test(text); // Detect Czech by checking for Czech-specific characters

  // Count tokens based on language characteristics
  if (isCzech) {
    // Czech tends to have longer tokens due to complex words
    return Math.ceil(text.length / 3.5);
  }

  // For English and other languages
  // Count words (more accurate than character count)
  const wordCount = text.split(/\s+/).length;

  // Add token count for special characters and formatting
  const specialCharsCount = (
    text.match(/[.,!?;:()\[\]{}""''`~@#$%^&*_+=<>|\\/-]/g) || []
  ).length;

  // Numbers tend to be tokenized differently
  const numberCount = (text.match(/\d+/g) || []).join("").length;

  // Base estimate: 1 token per 0.75 words (average)
  // Plus adjustments for special characters and numbers
  return (
    Math.ceil(wordCount / 0.75) +
    Math.ceil(specialCharsCount / 2) +
    Math.ceil(numberCount / 2)
  );
};

/**
 * Select the most appropriate model based on author summary request complexity
 * @param preferences User preferences for the summary
 * @returns Object with selected model and max tokens
 */
function selectOptimalAuthorModel(preferences: AuthorSummaryPreferences): {
  model: string;
  maxTokens: number;
} {
  // Base complexity score starts at 0
  let complexityScore = 0;

  // Add complexity based on preferences
  if (preferences.studyGuide) complexityScore += 3;
  if (preferences.includeTimeline) complexityScore += 1;
  if (preferences.includeAwards) complexityScore += 1;
  if (preferences.includeInfluences) complexityScore += 2;
  if (preferences.style === "academic") complexityScore += 1;
  if (preferences.length === "long") complexityScore += 2;

  // Select model based on complexity
  let model: string;
  let maxTokens: number;

  if (complexityScore >= 5) {
    // High complexity - use GPT-4o for best quality
    model = "gpt-4o";
    maxTokens =
      preferences.length === "long"
        ? 2000
        : preferences.length === "medium"
        ? 1000
        : 600;
  } else if (complexityScore >= 3) {
    // Medium complexity - use GPT-4o-mini for good balance
    model = "gpt-4o-mini";
    maxTokens =
      preferences.length === "long"
        ? 1500
        : preferences.length === "medium"
        ? 800
        : 500;
  } else {
    // Low complexity - use GPT-3.5 Turbo for efficiency
    model = "gpt-3.5-turbo";
    maxTokens =
      preferences.length === "long"
        ? 1200
        : preferences.length === "medium"
        ? 700
        : 400;
  }

  console.log(
    `Selected author model: ${model} (complexity score: ${complexityScore})`
  );
  return { model, maxTokens };
}

/**
 * Generate a summary about an author using OpenAI
 * @param author Author name
 * @param preferences Customization preferences
 * @returns Generated summary text
 */
export async function generateAuthorSummary(
  author: string,
  preferences: AuthorSummaryPreferences = DEFAULT_AUTHOR_PREFERENCES
): Promise<string> {
  try {
    // Check cache first
    const cacheKey = generateAuthorCacheKey(author, preferences);
    const cachedEntry = authorSummaryCache[cacheKey];

    // Check if we have a valid cache entry
    if (
      cachedEntry &&
      Date.now() - cachedEntry.timestamp < AUTHOR_CACHE_EXPIRATION
    ) {
      console.log("Author cache hit! Returning cached summary for:", author);
      return cachedEntry.summary;
    }

    console.log("Author cache miss or expired entry for:", author);

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Construct the prompt based on preferences
    const prompt = buildAuthorSummaryPrompt(author, preferences);

    // Calculate prompt tokens to ensure we have enough completion tokens
    const estimatedPromptTokens = estimateTokenCount(prompt) + 200; // Add buffer for system message

    // Select optimal model based on complexity
    const { model, maxTokens } = selectOptimalAuthorModel(preferences);

    // Ensure we don't exceed context window
    const contextWindow =
      model === "gpt-4o" ? 8192 : model === "gpt-4o-mini" ? 8192 : 4096;
    const adjustedMaxTokens = Math.min(
      maxTokens,
      // Ensure we don't exceed context window
      contextWindow - estimatedPromptTokens - 100 // 100 token safety buffer
    );

    // System message based on language
    const systemMessage =
      preferences.language === "cs"
        ? "Jsi literární expert specializující se na informace o autorech."
        : "You are a literary expert specializing in author information.";

    // Call OpenAI API
    console.log(`Generating author summary for ${author} using ${model} model`);
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: preferences.style === "creative" ? 0.8 : 0.6,
      max_tokens: adjustedMaxTokens,
    });

    const summary = response.choices[0]?.message?.content || "";

    // Cache the summary
    authorSummaryCache[cacheKey] = {
      summary,
      timestamp: Date.now(),
      preferences,
    };
    console.log("Author summary cached with key:", cacheKey);

    return summary;
  } catch (error) {
    console.error("Error generating author summary:", error);
    throw new Error(
      `Failed to generate author summary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Build a detailed prompt for author summary generation
 * @param author Author name
 * @param preferences Customization preferences
 * @returns Optimized prompt string
 */
function buildAuthorSummaryPrompt(
  author: string,
  preferences: AuthorSummaryPreferences
): string {
  const language = preferences.language === "cs" ? "českém" : "anglickém";

  // Define style characteristics with specific instructions
  const styleMap = {
    academic: {
      label: "formální, odborný",
      instruction:
        "Používej literárněvědnou terminologii, cituj odborné zdroje, analyzuj kriticky.",
    },
    casual: {
      label: "přístupný, konverzační",
      instruction:
        "Vyhýbej se odborným termínům, používej srozumitelný jazyk a přátelský tón.",
    },
    creative: {
      label: "živý, poutavý",
      instruction:
        "Používej barvitý jazyk, zajímavé příběhy a anekdoty, buď originální.",
    },
  };

  // Define focus areas with specific instructions
  const focusMap = {
    life: {
      label: "život autora",
      instruction:
        "Věnuj 70% obsahu životnímu příběhu, vzdělání a událostem, které formovaly tvorbu.",
    },
    works: {
      label: "díla autora",
      instruction:
        "Věnuj 70% obsahu literárním dílům, stylu psaní, tématům a vývoji tvorby.",
    },
    impact: {
      label: "vliv a odkaz",
      instruction:
        "Věnuj 70% obsahu vlivu na literaturu, společnost a významu pro současné čtenáře.",
    },
    balanced: {
      label: "vyvážený obsah",
      instruction: "Pokryj rovnoměrně život, díla i význam autora.",
    },
  };

  // Word count targets
  const lengthMap = {
    short: "150-200 slov",
    medium: "300-400 slov",
    long: "500-700 slov",
  };

  // Build a more directive but still concise base prompt
  let prompt = `Informace o autorovi "${author}" v ${language} jazyce.`;

  // Add study guide focus if enabled
  if (preferences.studyGuide) {
    prompt += ` Optimalizuj pro studijní účely a přípravu na zkoušky.`;
  }

  // Add style instruction
  prompt += ` Styl: ${styleMap[preferences.style].label}. ${
    styleMap[preferences.style].instruction
  }`;

  // Add focus instruction
  prompt += ` Zaměření: ${focusMap[preferences.focus].label}. ${
    focusMap[preferences.focus].instruction
  }`;

  // Add length
  prompt += ` Délka: ${lengthMap[preferences.length]}.`;

  // Add structured format for study guide
  if (preferences.studyGuide) {
    prompt += `

Strukturuj informace podle následujícího formátu:

# ${author}

## Základní informace
- **Celé jméno:** [celé jméno autora]
- **Datum narození a úmrtí:** [data]
- **Národnost:** [národnost]
- **Literární období/směr:** [období/směr]
- **Žánry:** [hlavní žánry]

## Život a vzdělání
- **Dětství a mládí:** [stručné informace o raném životě]
- **Vzdělání:** [vzdělání autora]
- **Klíčové životní události:** [důležité momenty, které ovlivnily tvorbu]
- **Osobní život:** [relevantní informace o osobním životě]

## Literární tvorba
- **Hlavní díla:** [seznam nejvýznamnějších děl s roky vydání]
- **Vývoj tvorby:** [jak se vyvíjela autorova tvorba v průběhu času]
- **Typické znaky tvorby:** [charakteristické rysy autorovy tvorby]
- **Témata a motivy:** [opakující se témata a motivy v dílech]

## Literární styl a techniky
- **Styl psaní:** [charakteristika stylu]
- **Jazykové prostředky:** [typické jazykové prostředky]
- **Narativní techniky:** [způsoby vyprávění]
- **Inovace:** [případné inovace, které autor přinesl]

## Literární a historický kontext
- **Literární směr:** [podrobnější informace o literárním směru]
- **Historický kontext:** [dobový kontext autorovy tvorby]
- **Společenské vlivy:** [jak společnost ovlivnila autora]
- **Srovnání s jinými autory:** [srovnání s podobnými autory]

## Význam a odkaz
- **Vliv na literaturu:** [jak autor ovlivnil literaturu]
- **Společenský dopad:** [jaký měl autor dopad na společnost]
- **Současná relevance:** [proč je autor důležitý i dnes]
- **Kritické hodnocení:** [jak je autor hodnocen kritiky]

## Studijní poznámky
- **Klíčové body pro zkoušky:** [co si zapamatovat pro zkoušky]
- **Typické otázky:** [jaké otázky se často objevují u zkoušek]
- **Doporučené souvislosti:** [s jakými jinými autory lze srovnávat]
- **Tipy pro analýzu děl:** [jak přistupovat k analýze autorových děl]`;
  } else {
    prompt += `

Strukturuj informace do logických sekcí s nadpisy a podnadpisy.`;
  }

  // Add additional sections based on preferences
  if (preferences.includeTimeline) {
    prompt += `

${preferences.studyGuide ? "## Časová osa" : "Přidej sekci s časovou osou"}
- [chronologický přehled klíčových událostí v životě a tvorbě autora]`;
  }

  if (preferences.includeAwards) {
    prompt += `

${
  preferences.studyGuide
    ? "## Ocenění a uznání"
    : "Přidej sekci s oceněními a uznáními"
}
- [seznam významných ocenění a uznání s roky]`;
  }

  if (preferences.includeInfluences) {
    prompt += `

${
  preferences.studyGuide
    ? "## Literární vlivy a inspirace"
    : "Přidej sekci o literárních vlivech a inspiracích"
}
- **Vlivy na autora:** [kdo autora ovlivnil]
- **Autorův vliv na jiné:** [koho autor ovlivnil]
- **Literární tradice:** [do jaké literární tradice autor patří]`;
  }

  // Add formatting instructions in a more compact way
  prompt += `

Formátuj text pomocí Markdown. Používej **tučné** pro důležité pojmy, *kurzívu* pro názvy děl, odrážky pro seznamy.

DŮLEŽITÉ: Vždy dokončuj své myšlenky a zajisti, že text je kompletní.`;

  return prompt.trim();
}
