import { useApiStore } from "../store/api-store";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method: HttpMethod;
  path: string;
  data?: unknown;
  params?: Record<string, string>;
}

export async function apiHandler<T>({
  method,
  path,
  data,
  params,
}: ApiOptions): Promise<T> {
  const { baseUrl, bearerToken } = useApiStore.getState();

  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  let response: Response;

  try {
    response = await fetch(url.toString(), options);
  } catch (error) {
    console.error("Fetch failed:", {
      url: url.toString(),
      method,
      error,
    });

    throw new Error(
      `Network error: Unable to connect to ${baseUrl}. Please check your internet connection and API configuration.`
    );
  }

  if (response.status === 401) {
    window.location.href = "/unauthorized";
    sessionStorage.setItem("bearer", bearerToken as string);
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : JSON.stringify(errorData.error);
      } else if (errorData.details) {
        errorMessage = errorData.details;
      }
    } catch {
      console.warn("Failed to parse error response as JSON");
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
