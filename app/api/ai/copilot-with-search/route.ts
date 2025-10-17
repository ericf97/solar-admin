import { streamText } from "ai";
import { searchWeb } from "@/services/serpapi-service";
import { NextRequest } from "next/server";

export const runtime = "edge";

async function performWebSearch(query: string, resultsCount: number = 10) {
  try {
    const searchResult = await searchWeb(query, { num: resultsCount });

    const formattedResults = searchResult.results
      .map((result, index) => {
        return `[${index + 1}] ${result.title}\n${result.snippet}\nURL: ${
          result.url
        }`;
      })
      .join("\n\n");

    return {
      success: true,
      query: searchResult.query,
      timestamp: searchResult.timestamp,
      content: formattedResults,
      sources: searchResult.results.map(r => ({ title: r.title, url: r.url })),
    };
  } catch (error) {
    console.error("[Web Search] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, model, resultsCount = 10 } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!model) {
      return new Response(JSON.stringify({ error: "Model is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchResult = await performWebSearch(message, resultsCount);

    let systemPrompt = `You are a web search assistant. You help users by searching the web and providing accurate, cited information.

When providing answers:
- Cite sources using [1], [2], etc. format
- Be accurate and factual
- Indicate when information is recent or time-sensitive
- Synthesize information from multiple sources when helpful`;

    let enhancedMessage = message;

    if (searchResult.success) {
      systemPrompt += `\n\nWeb search results for: "${searchResult.query}"\nTimestamp: ${searchResult.timestamp}\n\n${searchResult.content}\n\nUse these search results to answer the user's question. Always cite your sources.`;

      enhancedMessage = `Based on the web search results provided, please answer: ${message}`;
    } else {
      systemPrompt += `\n\nNote: Web search failed with error: ${searchResult.error}. Provide a response based on your existing knowledge and inform the user that current web data is unavailable.`;
    }

    const messages = [
      ...history,
      { role: "user" as const, content: enhancedMessage },
    ];

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Copilot with Search API] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

