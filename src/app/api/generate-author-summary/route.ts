import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Author from "@/models/Author";

export async function POST(request: Request) {
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();

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
