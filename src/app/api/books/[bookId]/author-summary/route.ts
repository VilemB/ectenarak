import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";
import { OpenAI } from "openai";
import Book from "@/models/Book";

// Initialize OpenAI client with proper error handling
const getOpenAIClient = () => {
  console.log("Getting OpenAI API key...");
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API key available?", !!apiKey);

  if (!apiKey) {
    console.error("OpenAI API key is not configured");
    throw new Error("OpenAI API key is not configured");
  }

  console.log("API key length:", apiKey.length);
  console.log("Creating OpenAI client instance...");

  try {
    const client = new OpenAI({
      apiKey,
    });
    console.log("OpenAI client created successfully");
    return client;
  } catch (error) {
    console.error("Error creating OpenAI client:", error);
    throw error;
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  console.log("=== AUTHOR SUMMARY API ROUTE START ===");
  console.log(`Received request for book ID: ${params.bookId}`);

  try {
    console.log("Author summary API route called with bookId:", params.bookId);

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("OpenAI API key configured:", !!apiKey);
    console.log("OpenAI API key length:", apiKey?.length);

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized: No user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = params.bookId;
    console.log("User ID:", userId);

    // Validate bookId
    if (!bookId || !ObjectId.isValid(bookId)) {
      console.log("Invalid book ID:", bookId);
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { author, preferences } = body;
    console.log("Author:", author);
    console.log("Preferences:", preferences);

    if (!author) {
      console.log("Missing author name");
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // Connect to database
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Connected to database");

    // Verify the book belongs to the user
    console.log("Finding book in database...");
    const book = await Book.findOne({
      _id: bookId,
      userId: userId,
    });

    if (!book) {
      console.log("Book not found or does not belong to the user");
      return NextResponse.json(
        { error: "Book not found or does not belong to the user" },
        { status: 404 }
      );
    }
    console.log("Book found:", book.title);

    // Generate author summary
    console.log("Generating author summary...");
    const summary = await generateAuthorSummary(author, preferences);
    console.log("Author summary generated successfully");

    // Update the book with the author summary
    console.log("Updating book with author summary...");
    book.authorSummary = summary;
    await book.save();
    console.log("Book updated successfully");

    console.log("=== AUTHOR SUMMARY API ROUTE SUCCESS ===");
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating author summary:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate author summary";
    console.error("Error message:", errorMessage);
    console.log("=== AUTHOR SUMMARY API ROUTE ERROR ===");
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function generateAuthorSummary(
  author: string,
  preferences: AuthorSummaryPreferences
): Promise<string> {
  try {
    console.log("=== START GENERATING AUTHOR SUMMARY ===");
    console.log("Generating for author:", author);
    console.log("With preferences:", JSON.stringify(preferences, null, 2));

    // Get OpenAI client
    console.log("Initializing OpenAI client...");
    const openai = getOpenAIClient();
    console.log("OpenAI client initialized successfully");

    // Construct the prompt based on preferences
    const language = preferences.language === "cs" ? "českém" : "anglickém";
    const style =
      preferences.style === "academic"
        ? "akademickém"
        : preferences.style === "casual"
        ? "neformálním"
        : "kreativním";
    const length =
      preferences.length === "short"
        ? "krátké"
        : preferences.length === "medium"
        ? "středně dlouhé"
        : "dlouhé";
    const focus =
      preferences.focus === "life"
        ? "život autora"
        : preferences.focus === "works"
        ? "díla autora"
        : preferences.focus === "impact"
        ? "vliv a význam autora"
        : "vyvážený obsah";

    let additionalInstructions = "";
    if (preferences.includeTimeline) {
      additionalInstructions +=
        " Zahrň chronologický přehled klíčových událostí v životě autora.";
    }
    if (preferences.includeAwards) {
      additionalInstructions +=
        " Uveď významná ocenění a uznání, která autor získal.";
    }
    if (preferences.includeInfluences) {
      additionalInstructions +=
        " Popiš literární vlivy a autory, kteří jej inspirovali.";
    }

    const prompt = `
      Vytvoř informace o autorovi "${author}" v ${language} jazyce.
      
      Použij ${style} styl psaní a vytvoř ${length} shrnutí zaměřené na ${focus}.${additionalInstructions}
      
      Formátuj text pomocí Markdown pro lepší čitelnost. Používej nadpisy, odrážky a další formátovací prvky, kde je to vhodné.
    `;

    console.log("Prompt prepared:", prompt);

    // Set max tokens based on length preference
    const maxTokens =
      preferences.length === "long"
        ? 1500
        : preferences.length === "medium"
        ? 800
        : 400;

    console.log("Max tokens:", maxTokens);
    console.log("Calling OpenAI API...");

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Jsi literární expert specializující se na informace o autorech. Tvým úkolem je poskytovat přesné, informativní a dobře strukturované informace o autorech podle zadaných preferencí.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    console.log("OpenAI API response received");

    if (!response.choices || response.choices.length === 0) {
      console.error("OpenAI API returned empty choices");
      throw new Error("OpenAI API returned empty response");
    }

    const content = response.choices[0].message.content;
    console.log("Content received, length:", content?.length);
    console.log("=== AUTHOR SUMMARY GENERATION COMPLETE ===");

    return content || "Nepodařilo se vygenerovat informace o autorovi.";
  } catch (error) {
    console.error("=== ERROR GENERATING AUTHOR SUMMARY ===");
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error.message.includes("API key")) {
        throw new Error("OpenAI API key is not configured correctly");
      }

      if (error.message.includes("429")) {
        throw new Error(
          "OpenAI API rate limit exceeded. Zkuste to prosím později."
        );
      }

      if (error.message.includes("401")) {
        throw new Error("OpenAI API key is invalid or expired");
      }
    }
    throw new Error("Failed to generate author summary");
  }
}
