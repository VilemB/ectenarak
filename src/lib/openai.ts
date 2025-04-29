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

  // Length-based complexity - Give 'long' a higher weight
  complexityScore +=
    preferences.length === "long" ? 4 : preferences.length === "medium" ? 1 : 0; // Use gpt-4o for long requests

  // Additional features complexity
  if (preferences.studyGuide) complexityScore += 2;
  if (preferences.includeTimeline) complexityScore += 1;
  if (preferences.includeAwards) complexityScore += 1;
  if (preferences.includeInfluences) complexityScore += 1;

  // Select model based on complexity
  // Lowered threshold slightly to ensure 'long' preference hits gpt-4o
  if (complexityScore >= 5) {
    return "gpt-4o"; // Use full GPT-4o for complex or long requests
  } else {
    return "gpt-4o-mini"; // Use cost-optimized mini model for standard requests
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
          ? 8000
          : preferences.length === "medium"
            ? 4000
            : 2000,
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
 * Builds the prompt for generating an author summary based on preferences.
 * Focuses on information relevant for Czech 'maturita' exam when language is Czech.
 * @param author Author name
 * @param preferences Summary preferences
 * @returns The constructed prompt string
 */
function buildAuthorSummaryPrompt(
  author: string,
  preferences: AuthorSummaryPreferences
): string {
  const {
    style,
    length,
    focus,
    language,
    includeTimeline,
    includeAwards,
    includeInfluences,
    studyGuide,
  } = preferences;

  const isCzech = language === "cs";
  let prompt = isCzech
    ? `Vytvoř podrobný přehled o autorovi ${author} se zaměřením na informace relevantní pro českou maturitní zkoušku. `
    : `Write a comprehensive overview of the author ${author}. `;

  // Style
  switch (style) {
    case "academic":
      prompt += isCzech
        ? `Použij akademický a objektivní tón. `
        : `Use an academic and objective tone. `;
      break;
    case "casual":
      prompt += isCzech
        ? `Použij neformální, přístupný a srozumitelný jazyk. `
        : `Use a casual, approachable, and understandable language. `;
      break;
    case "creative":
      prompt += isCzech
        ? `Buď v shrnutí kreativnější a interpretativnější. `
        : `Be more creative and interpretative in the summary. `;
      break;
  }

  // Length
  switch (length) {
    case "short":
      prompt += isCzech
        ? `Shrnutí by mělo být stručné, přibližně 150-250 slov. Zaměř se na nejdůležitější fakta. `
        : `Keep the summary concise, around 150-250 words. Focus on the most essential facts. `;
      break;
    case "medium":
      prompt += isCzech
        ? `Shrnutí by mělo být podrobné, ale ne příliš dlouhé, přibližně 400-600 slov. Poskytni vyvážený přehled. `
        : `The summary should be detailed but not overly long, around 400-600 words. Provide a balanced overview. `;
      break;
    case "long":
      prompt += isCzech
        ? `Poskytni komplexní a hloubkové shrnutí. Neboj se překročit 800 slov, pokud je to nutné k důkladnému pokrytí tématu. Struktura by měla být jasná a logická (např. život, dílo, význam). `
        : `Provide a comprehensive and in-depth summary. Feel free to exceed 800 words if necessary to cover the topic thoroughly. Ensure a clear and logical structure (e.g., life, works, significance). `;
      break;
  }

  // Focus
  const maturitaFocus = isCzech
    ? "Zaměř se především na klíčová díla, literární období, styl, hlavní témata a význam autora v kontextu české a světové literatury, jak je relevantní pro maturitu. "
    : "Focus primarily on key works, literary period, style, major themes, and the author's significance in the context of relevant literature, as relevant for final exams. ";

  switch (focus) {
    case "life":
      prompt += isCzech
        ? `Zaměř se primárně na autorovu biografii, životní události a osobní zkušenosti. ${maturitaFocus}`
        : `Focus primarily on the author's biography, life events, and personal experiences. ${maturitaFocus}`;
      break;
    case "works":
      prompt += isCzech
        ? `Zaměř se primárně na hlavní díla autora, literární styl, témata a přínos pro literaturu. ${maturitaFocus}`
        : `Focus primarily on the author's major works, literary style, themes, and contributions to literature. ${maturitaFocus}`;
      break;
    case "impact":
      prompt += isCzech
        ? `Zdůrazni význam autora, jeho odkaz a vliv na další generace nebo společnost. ${maturitaFocus}`
        : `Emphasize the author's significance, legacy, and impact on subsequent generations or society. ${maturitaFocus}`;
      break;
    case "balanced":
      prompt += isCzech
        ? `Poskytni vyvážený přehled o životě, díle a významu autora. ${maturitaFocus}`
        : `Provide a balanced overview of the author's life, works, and impact. ${maturitaFocus}`;
      break;
  }

  // Includes
  if (includeTimeline)
    prompt += isCzech
      ? `Zahrň časovou osu klíčových životních událostí a dat vydání děl. `
      : `Include a timeline of key life events and publication dates. `;
  if (includeAwards)
    prompt += isCzech
      ? `Zmiň významná ocenění a pocty, které autor obdržel. `
      : `Mention notable awards and honors received by the author. `;
  if (includeInfluences)
    prompt += isCzech
      ? `Diskutuj o klíčových vlivech na autora a jeho vlivu na ostatní. `
      : `Discuss key influences on the author and their influence on others. `;

  // Study Guide Format
  if (studyGuide)
    prompt += isCzech
      ? `Formátuj shrnutí jako studijní příručku, případně s použitím nadpisů, odrážek a klíčových bodů pro snazší učení. Zdůrazni aspekty relevantní pro maturitu. `
      : `Format the summary as a study guide, possibly using headings, bullet points, and key takeaways for easier learning. Emphasize aspects relevant for final exams. `;

  // Language
  prompt += isCzech
    ? `Celé shrnutí musí být napsáno v češtině. Použij vhodnou terminologii.`
    : `The entire summary must be written in English. Use appropriate terminology.`;

  prompt += isCzech
    ? ` Výstup formátuj pomocí Markdownu (nadpisy, seznamy atd.).`
    : ` Output the summary in Markdown format (headings, lists, etc.).`;

  return prompt.trim();
}
