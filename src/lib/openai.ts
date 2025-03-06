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
};

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
 * Calculate approximate token count for a string
 * This is a rough estimate (1 token ≈ 4 characters for English, may vary for other languages)
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
export const estimateTokenCount = (text: string): number => {
  // Average token is roughly 4 characters for English
  // For non-English languages, this might be different
  return Math.ceil(text.length / 4);
};

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
    // Get OpenAI client
    const openai = getOpenAIClient();

    // Construct the prompt based on preferences
    const prompt = buildAuthorSummaryPrompt(author, preferences);

    // Calculate prompt tokens to ensure we have enough completion tokens
    const estimatedPromptTokens = estimateTokenCount(prompt) + 200; // Add buffer for system message

    // Set max tokens based on length preference and available context window
    // GPT-4o has a 8192 token context window, we'll reserve some for the prompt
    const contextWindow = 8192;
    const maxCompletionTokens = Math.min(
      preferences.length === "long"
        ? 2000
        : preferences.length === "medium"
        ? 1000
        : 600,
      // Ensure we don't exceed context window
      contextWindow - estimatedPromptTokens - 100 // 100 token safety buffer
    );

    // Adjust temperature based on style
    const temperature =
      preferences.style === "creative"
        ? 0.8
        : preferences.style === "casual"
        ? 0.7
        : 0.5;

    // Select appropriate model based on task complexity
    // Use gpt-4o for complex summaries, gpt-4o-mini for simpler ones
    const model =
      preferences.length === "long" ||
      preferences.includeTimeline ||
      preferences.includeInfluences
        ? "gpt-4o"
        : "gpt-4o-mini";

    // System message based on language
    const systemMessage =
      preferences.language === "cs"
        ? "Jsi literární expert specializující se na informace o autorech. Tvým úkolem je poskytovat přesné, informativní a dobře strukturované informace o autorech podle zadaných preferencí. Vždy používej formátování markdown pro lepší čitelnost. Vždy dokončuj své myšlenky a zajisti, že text je kompletní."
        : "You are a literary expert specializing in author information. Your task is to provide accurate, informative, and well-structured information about authors according to the given preferences. Always use markdown formatting for better readability. Always complete your thoughts and ensure the text is complete.";

    // Call OpenAI API with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxCompletionTokens,
          // Ensure we get complete sentences
          stop: null,
          // Prevent truncation mid-sentence
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });

        if (!response.choices || response.choices.length === 0) {
          throw new Error("OpenAI API returned empty response");
        }

        const content = response.choices[0].message.content;

        if (!content) {
          throw new Error("OpenAI API returned empty content");
        }

        // Check if the response seems complete (ends with punctuation)
        const trimmedContent = content.trim();
        const endsWithPunctuation = /[.!?]$/.test(trimmedContent);

        if (!endsWithPunctuation && attempts < maxAttempts - 1) {
          // If response doesn't end with punctuation, try again with more tokens
          attempts++;
          continue;
        }

        return trimmedContent;
      } catch (error: unknown) {
        attempts++;

        // Handle rate limiting by waiting before retry
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          error.status === 429 &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
          continue;
        }

        // For other errors or final attempt, throw
        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error(
      "Failed to generate author summary after multiple attempts"
    );
  } catch (error) {
    console.error("Error generating author summary:", error);
    throw error;
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

  // Style instructions
  let styleInstructions = "";
  if (preferences.style === "academic") {
    styleInstructions =
      "formální, odborný styl s použitím literárněvědné terminologie. Používej akademický tón a odbornější slovní zásobu.";
  } else if (preferences.style === "casual") {
    styleInstructions =
      "přístupný, konverzační styl pro běžné čtenáře. Vyhýbej se příliš odborným termínům a používej přátelský, srozumitelný jazyk.";
  } else if (preferences.style === "creative") {
    styleInstructions =
      "živý, poutavý styl s důrazem na zajímavosti a příběhy. Buď kreativní, používej barvitý jazyk a snaž se čtenáře zaujmout.";
  }

  // Word count targets
  let wordCountTarget = "";
  if (preferences.length === "short") {
    wordCountTarget = "přibližně 150-200 slov";
  } else if (preferences.length === "medium") {
    wordCountTarget = "přibližně 300-400 slov";
  } else if (preferences.length === "long") {
    wordCountTarget = "přibližně 500-700 slov";
  }

  // Focus instructions
  let focusInstructions = "";
  if (preferences.focus === "life") {
    focusInstructions =
      "životní příběh autora, osobní život, vzdělání, důležité životní události a klíčové momenty, které formovaly jeho tvorbu";
  } else if (preferences.focus === "works") {
    focusInstructions =
      "literární díla autora, jeho styl psaní, hlavní témata, vývoj tvorby a nejvýznamnější publikace";
  } else if (preferences.focus === "impact") {
    focusInstructions =
      "vliv autora na literaturu a společnost, jeho odkaz, jak změnil svůj žánr nebo literární scénu, a jaký má význam pro současné čtenáře";
  } else if (preferences.focus === "balanced") {
    focusInstructions =
      "vyvážené pokrytí života autora, jeho děl i významu - poskytni ucelený obraz o autorovi";
  }

  // Additional sections
  const additionalSections = [];
  if (preferences.includeTimeline) {
    additionalSections.push(
      "chronologický přehled klíčových událostí v životě autora"
    );
  }
  if (preferences.includeAwards) {
    additionalSections.push(
      "seznam významných ocenění a uznání, která autor získal"
    );
  }
  if (preferences.includeInfluences) {
    additionalSections.push(
      "informace o literárních vlivech a autorech, kteří jej inspirovali"
    );
  }

  let additionalSectionsText = "";
  if (additionalSections.length > 0) {
    additionalSectionsText =
      "\n\nZahrň také tyto sekce:\n" +
      additionalSections.map((section) => `- ${section}`).join("\n");
  }

  // Structure suggestion
  let structureSuggestion =
    "Rozděl text do logických sekcí s nadpisy a podnadpisy.";
  if (preferences.focus === "life") {
    structureSuggestion +=
      " Například: Dětství a mládí, Vzdělání, Kariéra, Osobní život, Pozdní léta.";
  } else if (preferences.focus === "works") {
    structureSuggestion +=
      " Například: Rané dílo, Hlavní díla, Styl psaní, Témata, Odkaz.";
  } else if (preferences.focus === "impact") {
    structureSuggestion +=
      " Například: Literární přínos, Společenský vliv, Odkaz, Současná relevance.";
  } else if (preferences.focus === "balanced") {
    structureSuggestion +=
      " Například: Život, Dílo, Styl a témata, Vliv a odkaz.";
  }

  // Build the complete prompt
  return `
Vytvoř informace o autorovi "${author}" v ${language} jazyce.

Použij ${styleInstructions}

Délka textu by měla být ${wordCountTarget}.

Zaměř se především na ${focusInstructions}.${additionalSectionsText}

${structureSuggestion}

Formátuj text pomocí Markdown pro lepší čitelnost:
- Použij # pro hlavní nadpis s jménem autora
- Použij ## pro sekce
- Použij ### pro podsekce
- Používej **tučný text** pro zvýraznění důležitých informací
- Používej *kurzívu* pro názvy děl
- Používej odrážky pro seznamy
- Pokud je to vhodné, můžeš použít > pro citace autora

DŮLEŽITÉ: Vždy dokončuj své myšlenky a zajisti, že text je kompletní a nekončí uprostřed věty.
`.trim();
}
