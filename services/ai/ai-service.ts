import { streamText, generateText } from "ai";
import { searchWeb } from "@/services/serpapi-service";

export interface AIStreamOptions {
  model: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
  webSearchEnabled?: boolean;
  webSearchResultsCount?: number;
}

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
    console.error("[AI Service] Web Search Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function streamAIResponse({
  model,
  systemPrompt,
  userMessage,
  conversationHistory = [],
  temperature = 0.7,
  webSearchEnabled = false,
  webSearchResultsCount = 10,
}: AIStreamOptions) {
  try {
    let enhancedSystemPrompt = systemPrompt;
    let enhancedUserMessage = userMessage;

    if (webSearchEnabled) {
      const searchResult = await performWebSearch(
        userMessage,
        webSearchResultsCount
      );

      if (searchResult.success) {
        enhancedSystemPrompt += `\n\n--- WEB SEARCH RESULTS ---\nQuery: "${searchResult.query}"\nTimestamp: ${searchResult.timestamp}\n\n${searchResult.content}\n\nUse these search results to provide accurate, up-to-date information. Always cite your sources using [1], [2], etc. format.`;

        enhancedUserMessage = `Based on the web search results provided, please answer: ${userMessage}`;
      } else {
        enhancedSystemPrompt += `\n\nNote: Web search was attempted but failed (${searchResult.error}). Provide a response based on your existing knowledge and inform the user that current web data is unavailable.`;
      }
    }

    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: enhancedUserMessage },
    ];

    const result = streamText({
      model,
      system: enhancedSystemPrompt,
      messages,
      temperature,
    });

    return result;
  } catch (error) {
    console.error("[AI Service] Error in streamAIResponse:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });
    throw error;
  }
}

export interface AIGenerateOptions {
  model: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
  webSearchEnabled?: boolean;
  webSearchResultsCount?: number;
}

export async function generateAIResponse({
  model,
  systemPrompt,
  userMessage,
  conversationHistory = [],
  temperature = 0.7,
  webSearchEnabled = false,
  webSearchResultsCount = 10,
}: AIGenerateOptions): Promise<string> {
  try {
    let enhancedSystemPrompt = systemPrompt;
    let enhancedUserMessage = userMessage;

    if (webSearchEnabled) {
      const searchResult = await performWebSearch(
        userMessage,
        webSearchResultsCount
      );

      if (searchResult.success) {
        enhancedSystemPrompt += `\n\n--- WEB SEARCH RESULTS ---\nQuery: "${searchResult.query}"\nTimestamp: ${searchResult.timestamp}\n\n${searchResult.content}\n\nUse these search results to provide accurate, up-to-date information. Always cite your sources using [1], [2], etc. format.`;

        enhancedUserMessage = `Based on the web search results provided, please answer: ${userMessage}`;
      } else {
        enhancedSystemPrompt += `\n\nNote: Web search was attempted but failed (${searchResult.error}). Provide a response based on your existing knowledge and inform the user that current web data is unavailable.`;
      }
    }

    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: enhancedUserMessage },
    ];

    const result = await generateText({
      model,
      system: enhancedSystemPrompt,
      messages,
      temperature,
    });

    return result.text;
  } catch (error) {
    console.error("[AI Service] Error in generateAIResponse:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });
    throw error;
  }
}

