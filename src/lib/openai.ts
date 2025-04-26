import { OpenAI } from "openai";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";

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

// Cache implementation
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const authorSummaryCache = new Map<
  string,
  { summary: string; timestamp: number }
>();

async function getCachedSummary(cacheKey: string): Promise<string | null> {
  const cached = authorSummaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
    return cached.summary;
  }
  return null;
}

async function cacheSummary(cacheKey: string, summary: string): Promise<void> {
  authorSummaryCache.set(cacheKey, {
    summary,
    timestamp: Date.now(),
  });
}

/**
 * Generate a cache key for author summaries
 * @param author Author name
 * @param preferences Summary preferences
 * @returns Cache key string
 */
// Commented out as it's not currently used
// function generateAuthorCacheKey(
//   author: string,
//   preferences: AuthorSummaryPreferences
// ): string {
//   // Create a simplified version of preferences for the cache key
//   const simplifiedPrefs = {
//     style: preferences.style,
//     length: preferences.length,
//     focus: preferences.focus,
//     language: preferences.language,
//     hasTimeline: preferences.includeTimeline,
//     hasAwards: preferences.includeAwards,
//     hasInfluences: preferences.includeInfluences,
//     hasStudyGuide: preferences.studyGuide,
//   };

//   // Create a string to hash
//   const stringToHash = `${author}|${JSON.stringify(simplifiedPrefs)}`;

//   // Generate a hash for the cache key
//   return createHash("md5").update(stringToHash).digest("hex");
// }

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
function selectOptimalAuthorModel(
  preferences: AuthorSummaryPreferences
): string {
  // Base complexity score calculation
  let complexityScore = 0;

  // Style-based complexity
  complexityScore +=
    preferences.style === "academic"
      ? 2
      : preferences.style === "creative"
        ? 1
        : 0;

  // Length-based complexity
  complexityScore +=
    preferences.length === "long" ? 2 : preferences.length === "medium" ? 1 : 0;

  // Additional features complexity
  if (preferences.studyGuide) complexityScore += 2;
  if (preferences.includeTimeline) complexityScore += 1;
  if (preferences.includeAwards) complexityScore += 1;
  if (preferences.includeInfluences) complexityScore += 1;

  // Select model based on complexity and subscription tier
  if (complexityScore >= 6) {
    return "gpt-4o"; // Use full GPT-4o for very complex requests
  } else {
    return "gpt-4o-mini"; // Use cost-optimized mini model for moderate complexity
  }
}

/**
 * Check if a summary appears to be cut off or incomplete
 * @param summary The summary text to check
 * @returns True if the summary appears complete, false if it seems cut off
 */
// Commented out as not currently used
// function isSummaryComplete(summary: string): boolean {
//   if (!summary) return false;

//   // Trim whitespace
//   const trimmedSummary = summary.trim();

//   // Check if summary ends with proper punctuation
//   const endsWithProperPunctuation = /[.!?]$/.test(trimmedSummary);

//   // Check if summary has a reasonable length
//   const hasReasonableLength = trimmedSummary.length > 100;

//   // Check if summary contains expected sections (for structured summaries)
//   const hasExpectedSections =
//     trimmedSummary.includes("# ") && // Has a main heading
//     (trimmedSummary.includes("## ") || trimmedSummary.includes("\n\n")); // Has sections or paragraphs

//   // Check if summary doesn't end mid-sentence
//   const lastSentence = trimmedSummary.split(/[.!?]/).pop() || "";
//   const lastSentenceComplete =
//     lastSentence.trim().split(/\s+/).length < 4 || endsWithProperPunctuation;

//   // Check if summary doesn't have obvious truncation markers
//   const noTruncationMarkers =
//     !trimmedSummary.endsWith("...") &&
//     !trimmedSummary.endsWith("…") &&
//     !trimmedSummary.endsWith("-");

//   return (
//     hasReasonableLength &&
//     hasExpectedSections &&
//     lastSentenceComplete &&
//     noTruncationMarkers
//   );
// }

/**
 * Fix a potentially incomplete summary by adding a completion notice
 * @param summary The potentially incomplete summary
 * @returns Fixed summary with a completion notice if needed
 */
// Commented out as it's not currently used
// function fixIncompleteAuthorSummary(
//   summary: string,
//   author: string,
//   language: string
// ): string {
//   if (isSummaryComplete(summary)) {
//     return summary;
//   }

//   // Add a notice about the incomplete summary
//   const notice =
//     language === "cs"
//       ? `\n\n---\n\n**Poznámka:** Informace o autorovi ${author} mohou být neúplné. Pro získání kompletních informací zkuste přegenerovat informace o autorovi s jinými preferencemi nebo kratší délkou.`
//       : `\n\n---\n\n**Note:** The information about author ${author} may be incomplete. To get complete information, try regenerating author information with different preferences or a shorter length.`;

//   return summary + notice;
// }

/**
 * Generate a summary about an author using OpenAI
 * @param author Author name
 * @param preferences Customization preferences
 * @returns Generated summary text
 */
export async function generateAuthorSummary(
  author: string,
  preferences: AuthorSummaryPreferences = DEFAULT_AUTHOR_PREFERENCES,
  cacheKey?: string
): Promise<string> {
  // Check cache first if key provided
  if (cacheKey) {
    const cached = await getCachedSummary(cacheKey);
    if (cached) return cached;
  }

  const model = selectOptimalAuthorModel(preferences);
  const prompt = buildAuthorSummaryPrompt(author, preferences);

  // Replace the systemMessage declaration
  const systemPrompt =
    preferences.language === "cs"
      ? `Jsi ${
          preferences.style === "academic"
            ? "literární vědec a akademik"
            : preferences.style === "casual"
              ? "zkušený literární publicista"
              : "kreativní spisovatel a vypravěč"
        } specializující se na informace o autorech.`
      : `You are ${
          preferences.style === "academic"
            ? "a literary scholar and academic"
            : preferences.style === "casual"
              ? "an experienced literary journalist"
              : "a creative writer and storyteller"
        } specializing in author information.`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: preferences.style === "creative" ? 0.8 : 0.3,
      max_tokens:
        preferences.length === "long"
          ? 4000
          : preferences.length === "medium"
            ? 2500
            : 1500,
      presence_penalty: preferences.style === "creative" ? 0.6 : 0.2,
      frequency_penalty: preferences.style === "creative" ? 0.6 : 0.3,
    });

    const summary = completion.choices[0]?.message?.content || "";

    // Cache the result if key provided
    if (cacheKey) {
      await cacheSummary(cacheKey, summary);
    }

    return summary;
  } catch (error) {
    console.error("Error generating author summary:", error);
    throw new Error("Failed to generate author summary");
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

  // Enhanced style characteristics with more specific instructions
  const styleMap = {
    academic: {
      label: "formální, odborný",
      instruction: `Používej:
- Odbornou literárněvědnou terminologii
- Citace z odborných zdrojů a kritických prací
- Formální, objektivní jazyk
- Analytický a kritický přístup
- Přesné datace a bibliografické údaje
- Odkazy na literární teorie a koncepty
Vyhýbej se:
- Subjektivním hodnocením
- Neformálnímu jazyku
- Anekdotám a osobním příběhům`,
    },
    casual: {
      label: "přístupný, konverzační",
      instruction: `Používej:
- Srozumitelný, každodenní jazyk
- Přátelský, konverzační tón
- Praktické příklady a přirovnání
- Osobní perspektivu a přímé oslovení
- Zajímavé detaily ze života autora
- Propojení s dnešní dobou
Vyhýbej se:
- Odborné terminologii
- Složitým souvětím
- Suchým faktům bez kontextu`,
    },
    creative: {
      label: "živý, poutavý",
      instruction: `Používej:
- Barvitý, expresivní jazyk
- Metafory a přirovnání
- Dramatické prvky a napětí
- Osobní příběhy a anekdoty
- Emocionální prvky
- Neotřelé úhly pohledu
Vyhýbej se:
- Suchému akademickému stylu
- Strohému výčtu faktů
- Přílišné formálnosti`,
    },
  };

  // Enhanced focus areas with specific content ratios
  const focusMap = {
    life: {
      label: "život autora",
      instruction: `Rozložení obsahu:
- 70% životní příběh a osobní vývoj
- 20% vliv života na dílo
- 10% literární kontext
Zaměř se na:
- Klíčové životní události
- Vzdělání a formativní zkušenosti
- Osobní vztahy a vlivy
- Společenský a historický kontext`,
    },
    works: {
      label: "díla autora",
      instruction: `Rozložení obsahu:
- 70% analýza děl a tvůrčího procesu
- 20% vývoj autorského stylu
- 10% biografický kontext
Zaměř se na:
- Hlavní díla a jejich témata
- Vývoj autorského stylu
- Inovace v tvorbě
- Literární techniky`,
    },
    impact: {
      label: "vliv a odkaz",
      instruction: `Rozložení obsahu:
- 70% vliv na literaturu a společnost
- 20% současná relevance
- 10% historický kontext
Zaměř se na:
- Literární odkaz
- Společenský dopad
- Vliv na další autory
- Aktuální význam`,
    },
    balanced: {
      label: "vyvážený obsah",
      instruction: `Rozložení obsahu:
- 33% život a osobnost
- 33% literární dílo
- 33% význam a vliv
Zaměř se na:
- Propojení života a díla
- Kontext doby
- Odkaz pro současnost`,
    },
  };

  // Word count targets with token optimization
  const lengthMap = {
    short: {
      words: "150-200 slov",
      structure: "3-4 stručné odstavce",
    },
    medium: {
      words: "300-400 slov",
      structure: "5-6 rozvinutých odstavců",
    },
    long: {
      words: "500-700 slov",
      structure: "7-8 detailních odstavců",
    },
  };

  // Build the main prompt
  let prompt = `Vytvoř ${
    styleMap[preferences.style].label
  } text o autorovi "${author}" v ${language} jazyce.

${focusMap[preferences.focus].instruction}

Délka: ${lengthMap[preferences.length].words} (${
    lengthMap[preferences.length].structure
  }).`;

  // Add study guide structure if enabled
  if (preferences.studyGuide) {
    prompt += `

Strukturuj text pro studijní účely:

# ${author}

## Základní informace
[stručný přehled klíčových faktů]

## Život a vzdělání
[podle zvoleného zaměření]

## Literární tvorba
[podle zvoleného zaměření]

## Význam a odkaz
[podle zvoleného zaměření]

## Studijní poznámky
[klíčové body pro studium]`;
  }

  // Add additional sections based on preferences
  if (preferences.includeTimeline) {
    prompt += `

## Časová osa
[chronologický přehled uspořádaný podle zvoleného stylu]`;
  }

  if (preferences.includeAwards) {
    prompt += `

## Ocenění
[seznam ocenění prezentovaný podle zvoleného stylu]`;
  }

  if (preferences.includeInfluences) {
    prompt += `

## Literární vlivy
[literární kontext podle zvoleného stylu]`;
  }

  // Add formatting instructions
  prompt += `

Formátování:
- Používej markdown pro strukturování
- **Tučně** pro klíčové pojmy
- *Kurzívu* pro názvy děl
- Odrážky pro přehledné seznamy

DŮLEŽITÉ: Text musí být kompletní a konzistentní se zvoleným stylem od začátku do konce. Při limitech tokenů zachovej všechny sekce, ale zkrať jejich obsah proporcionálně.`;

  return prompt.trim();
}
