import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import { streamText, formatDataStreamPart } from "ai";
import { openai as openaiProvider } from "@ai-sdk/openai";
import { DEFAULT_AUTHOR_PREFERENCES } from "@/lib/openai";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";
import { checkSubscription } from "@/middleware/subscriptionMiddleware";

/**
 * Consolidated API route for author summaries
 * Handles both general author summaries and book-specific summaries
 *
 * Request body:
 * - author: string (required) - The name of the author
 * - preferences: AuthorSummaryPreferences (optional) - Customization preferences
 * - bookId: string (optional) - If provided, associates the summary with this book
 * - clientSideDeduction: boolean (optional) - Indicates if credits have already been deducted on the client side
 */
export async function POST(req: NextRequest) {
  console.log("=== STREAMING AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Check subscription requirements first
    const subscriptionCheck = await checkSubscription(req, {
      requireAiCredits: true,
    });

    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.response as NextResponse;
    }
    const user = subscriptionCheck.user; // User is guaranteed to exist if allowed

    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const {
      author,
      preferences = DEFAULT_AUTHOR_PREFERENCES,
      clientSideDeduction = false,
    } = body;

    console.log("Request parameters:", {
      author,
      hasPreferences: !!preferences,
      clientSideDeduction,
    });

    if (!author) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // --- Check Author Cache in DB ---
    let authorDoc = await Author.findOne({ name: author });
    if (authorDoc && authorDoc.summary) {
      console.log(`Cache hit in DB for author: ${author}`);
      // Return cached summary as a single stream chunk
      return new Response(formatDataStreamPart("text", authorDoc.summary), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    console.log(`Cache miss in DB for author: ${author}. Generating...`);
    // --- End Cache Check ---

    // Prepare for generation
    const model = selectOptimalAuthorModel(preferences);
    const prompt = buildAuthorSummaryPrompt(author, preferences);
    const systemPrompt =
      preferences.language === "cs" ? "Jsi ..." : "You are ..."; // Fill from buildAuthorSummaryPrompt logic

    console.log(`Using OpenAI model: ${model}`);

    // Call AI SDK streamText
    const result = await streamText({
      model: openaiProvider(model),
      system: systemPrompt,
      prompt: prompt, // Use prompt for user message with streamText
      temperature: preferences.style === "creative" ? 0.8 : 0.3,
      maxTokens:
        preferences.length === "long"
          ? 2000
          : preferences.length === "medium"
            ? 1200
            : 800,
      presencePenalty: preferences.style === "creative" ? 0.6 : 0.2,
      frequencyPenalty: preferences.style === "creative" ? 0.6 : 0.3,

      // Save to DB on completion
      async onFinish({ text }) {
        console.log("Author summary generation finished. Saving to DB...");
        try {
          if (!authorDoc) {
            authorDoc = new Author({ name: author, summary: text });
          } else {
            authorDoc.summary = text;
          }
          await authorDoc.save();
          console.log(`Author summary saved to DB for: ${author}`);

          // Deduct credit server-side ONLY if not deducted on client
          if (!clientSideDeduction && user) {
            // Fire and forget credit deduction
            user
              .useAiCredit()
              .then((remaining) =>
                console.log(
                  `Async credit deducted for author summary. Remaining: ${remaining}`
                )
              )
              .catch((err) =>
                console.error("Async credit deduction error:", err)
              );
          }
        } catch (dbError) {
          console.error(
            `Error saving author summary to DB for ${author}:`,
            dbError
          );
          // Don't throw error to client, just log it. Generation succeeded.
        }
      },
    });

    // Return the stream
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in streaming author summary API:", error);
    // Handle potential credit errors specifically if possible
    if (error instanceof Error && error.message.includes("credit")) {
      return NextResponse.json(
        { error: "Došly vám AI kredity" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate author summary",
      },
      { status: 500 }
    );
  }
}

// Helper function for selecting model
function selectOptimalAuthorModel(
  preferences: AuthorSummaryPreferences
): string {
  let complexityScore = 0;
  complexityScore +=
    preferences.style === "academic"
      ? 2
      : preferences.style === "creative"
        ? 1
        : 0;
  complexityScore +=
    preferences.length === "long" ? 2 : preferences.length === "medium" ? 1 : 0;
  if (preferences.studyGuide) complexityScore += 2;
  if (preferences.includeTimeline) complexityScore += 1;
  if (preferences.includeAwards) complexityScore += 1;
  if (preferences.includeInfluences) complexityScore += 1;

  if (complexityScore >= 6) {
    return "gpt-4o";
  } else {
    return "gpt-4o-mini";
  }
}

// Helper function for building prompt with full instructions
function buildAuthorSummaryPrompt(
  author: string,
  preferences: AuthorSummaryPreferences
): string {
  const language = preferences.language === "cs" ? "českém" : "anglickém";

  // Enhanced style characteristics with full instructions
  const styleMap = {
    academic: {
      label: "formální, odborný",
      instruction: `Používej:\n- Odbornou literárněvědnou terminologii\n- Citace z odborných zdrojů a kritických prací\n- Formální, objektivní jazyk\n- Analytický a kritický přístup\n- Přesné datace a bibliografické údaje\n- Odkazy na literární teorie a koncepty\nVyhýbej se:\n- Subjektivním hodnocením\n- Neformálnímu jazyku\n- Anekdotám a osobním příběhům`,
    },
    casual: {
      label: "přístupný, konverzační",
      instruction: `Používej:\n- Srozumitelný, každodenní jazyk\n- Přátelský, konverzační tón\n- Praktické příklady a přirovnání\n- Osobní perspektivu a přímé oslovení\n- Zajímavé detaily ze života autora\n- Propojení s dnešní dobou\nVyhýbej se:\n- Odborné terminologii\n- Složitým souvětím\n- Suchým faktům bez kontextu`,
    },
    creative: {
      label: "živý, poutavý",
      instruction: `Používej:\n- Barvitý, expresivní jazyk\n- Metafory a přirovnání\n- Dramatické prvky a napětí\n- Osobní příběhy a anekdoty\n- Emocionální prvky\n- Neotřelé úhly pohledu\nVyhýbej se:\n- Suchému akademickému stylu\n- Strohému výčtu faktů\n- Přílišné formálnosti`,
    },
  };

  // Enhanced focus areas with specific content ratios
  const focusMap = {
    life: {
      label: "život autora",
      instruction: `Rozložení obsahu:\n- 70% životní příběh a osobní vývoj\n- 20% vliv života na dílo\n- 10% literární kontext\nZaměř se na:\n- Klíčové životní události\n- Vzdělání a formativní zkušenosti\n- Osobní vztahy a vlivy\n- Společenský a historický kontext`,
    },
    works: {
      label: "díla autora",
      instruction: `Rozložení obsahu:\n- 70% analýza děl a tvůrčího procesu\n- 20% vývoj autorského stylu\n- 10% biografický kontext\nZaměř se na:\n- Hlavní díla a jejich témata\n- Vývoj autorského stylu\n- Inovace v tvorbě\n- Literární techniky`,
    },
    impact: {
      label: "vliv a odkaz",
      instruction: `Rozložení obsahu:\n- 70% vliv na literaturu a společnost\n- 20% současná relevance\n- 10% historický kontext\nZaměř se na:\n- Literární odkaz\n- Společenský dopad\n- Vliv na další autory\n- Aktuální význam`,
    },
    balanced: {
      label: "vyvážený obsah",
      instruction: `Rozložení obsahu:\n- 33% život a osobnost\n- 33% literární dílo\n- 33% význam a vliv\nZaměř se na:\n- Propojení života a díla\n- Kontext doby\n- Odkaz pro současnost`,
    },
  };

  // Word count targets
  const lengthMap = {
    short: { words: "150-200 slov", structure: "3-4 stručné odstavce" },
    medium: { words: "300-400 slov", structure: "5-6 rozvinutých odstavců" },
    long: { words: "500-700 slov", structure: "7-8 detailních odstavců" },
  };

  // Build the main prompt
  let prompt = `Vytvoř ${styleMap[preferences.style].label} text o autorovi \"${author}\" v ${language} jazyce.\n\n`;
  prompt += `${focusMap[preferences.focus].instruction}\n\n`;
  prompt += `Délka: ${lengthMap[preferences.length].words} (${lengthMap[preferences.length].structure}).\n`;

  // Add study guide structure if enabled
  if (preferences.studyGuide) {
    prompt += `\nStrukturuj text pro studijní účely:\n\n# ${author}\n\n## Základní informace\n[stručný přehled klíčových faktů]\n\n## Život a vzdělání\n[podle zvoleného zaměření]\n\n## Literární tvorba\n[podle zvoleného zaměření]\n\n## Význam a odkaz\n[podle zvoleného zaměření]\n\n## Studijní poznámky\n[klíčové body pro studium]`;
  }

  // Add additional sections based on preferences
  if (preferences.includeTimeline) {
    prompt += `\n\n## Časová osa\n[chronologický přehled uspořádaný podle zvoleného stylu]`;
  }
  if (preferences.includeAwards) {
    prompt += `\n\n## Ocenění\n[seznam ocenění prezentovaný podle zvoleného stylu]`;
  }
  if (preferences.includeInfluences) {
    prompt += `\n\n## Literární vlivy\n[literární kontext podle zvoleného stylu]`;
  }

  // Add formatting instructions
  prompt += `\n\nFormátování:\n- Používej markdown pro strukturování\n- **Tučně** pro klíčové pojmy\n- *Kurzívu* pro názvy děl\n- Odrážky pro přehledné seznamy\n\nDŮLEŽITÉ: Text musí být kompletní a konzistentní se zvoleným stylem od začátku do konce. Při limitech tokenů zachovej všechny sekce, ale zkrať jejich obsah proporcionálně.`;

  return prompt.trim();
}
