import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthorSummaryPreferences } from "@/components/AuthorSummaryPreferencesModal";
import { OpenAI } from "openai";
import Book from "@/models/Book";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = params.bookId;

    // Validate bookId
    if (!bookId || !ObjectId.isValid(bookId)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { author, preferences } = body;

    if (!author) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Verify the book belongs to the user
    const book = await Book.findOne({
      _id: bookId,
      userId: userId,
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or does not belong to the user" },
        { status: 404 }
      );
    }

    // Generate author summary
    const summary = await generateAuthorSummary(author, preferences);

    // Update the book with the author summary
    book.authorSummary = summary;
    await book.save();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating author summary:", error);
    return NextResponse.json(
      { error: "Failed to generate author summary" },
      { status: 500 }
    );
  }
}

async function generateAuthorSummary(
  author: string,
  preferences: AuthorSummaryPreferences
): Promise<string> {
  try {
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
      max_tokens:
        preferences.length === "long"
          ? 1500
          : preferences.length === "medium"
          ? 800
          : 400,
    });

    return (
      response.choices[0].message.content ||
      "Nepodařilo se vygenerovat informace o autorovi."
    );
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate author summary");
  }
}
