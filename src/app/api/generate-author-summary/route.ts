import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";
import { OpenAI } from "openai";

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

export async function POST(request: Request) {
  console.log("=== GENERAL AUTHOR SUMMARY API ROUTE START ===");

  try {
    // Connect to the database
    await dbConnect();

    // Get the author name from the request
    const { author } = await request.json();

    if (!author) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 }
      );
    }

    // Check if we already have a summary for this author
    let authorDoc = await Author.findOne({ name: author });

    // If we have an existing summary, return it
    if (authorDoc && authorDoc.summary) {
      console.log(`Using existing summary for author: ${author}`);
      return NextResponse.json({ summary: authorDoc.summary });
    }

    // If the author exists but has no summary, or doesn't exist at all,
    // generate a new summary
    console.log(`Generating new summary for author: ${author}`);

    // Call OpenAI API to generate the summary
    let summary: string;

    try {
      console.log("Initializing OpenAI client...");
      const openai = getOpenAIClient();
      console.log("Calling OpenAI API...");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides concise, informative summaries about authors.",
          },
          {
            role: "user",
            content: `Provide a brief summary about the author ${author}. Include key biographical information, major works, writing style, and significance in literature. Format the response in markdown.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("OpenAI API returned empty response");
      }

      const content = response.choices[0].message.content;
      summary = content
        ? content.trim()
        : "Nepodařilo se vygenerovat informace o autorovi.";
      console.log("Summary generated successfully");
    } catch (error) {
      console.error("Error in OpenAI API call:", error);
      throw new Error("Failed to generate author summary via OpenAI");
    }

    // Save or update the author in the database
    if (!authorDoc) {
      authorDoc = new Author({
        name: author,
        summary: summary,
      });
    } else {
      authorDoc.summary = summary;
    }

    await authorDoc.save();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating author summary:", error);
    return NextResponse.json(
      { error: "Failed to generate author summary" },
      { status: 500 }
    );
  }
}
