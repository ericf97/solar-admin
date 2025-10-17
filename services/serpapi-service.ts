export interface SerpAPISearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface SerpAPIResponse {
  organic_results?: SerpAPISearchResult[];
  answer_box?: {
    answer?: string;
    snippet?: string;
  };
  knowledge_graph?: {
    title?: string;
    description?: string;
  };
}

export interface WebSearchResult {
  query: string;
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
  timestamp: string;
}

export async function searchWeb(
  query: string,
  options?: {
    num?: number;
    location?: string;
  }
): Promise<WebSearchResult> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    throw new Error("SERPAPI_KEY is not configured");
  }

  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    num: String(options?.num || 10),
    ...(options?.location && { location: options.location }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.statusText}`);
  }

  const data: SerpAPIResponse = await response.json();

  const results = (data.organic_results || []).map(result => ({
    title: result.title,
    url: result.link,
    snippet: result.snippet,
  }));

  return {
    query,
    results,
    timestamp: new Date().toISOString(),
  };
}

