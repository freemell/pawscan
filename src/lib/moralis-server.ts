const BASE_URL = "https://solana-gateway.moralis.io";

// Note: In-memory rate limiting doesn't work in serverless (Vercel) because each
// function invocation is a separate instance. We rely on:
// 1. Next.js fetch cache (next: { revalidate })
// 2. Server-side caching with unstable_cache in API routes
// 3. Moralis API's own rate limiting (returns 429 when exceeded)

function ensureApiKey() {
  const key = process.env.MORALIS_API_KEY;
  if (!key) {
    throw new Error("Missing MORALIS_API_KEY in environment.");
  }
  return key;
}

export async function moralisFetch<T>(
  path: string,
  search?: Record<string, string | number | undefined>,
): Promise<T> {
  const apiKey = ensureApiKey();
  const query = search
    ? "?" +
      Object.entries(search)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&")
    : "";

  // Add timeout and better error handling for Moralis API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${BASE_URL}${path}${query}`, {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
      signal: controller.signal,
      next: { revalidate: 600 }, // 10 minutes cache (aggressive for Free Tier & serverless)
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      console.error("Moralis error", response.status, body);

      // Handle 429 Rate Limit errors specifically (from Moralis API)
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
          `RATE_LIMIT_429: Daily CU limit reached. ${retryAfter ? `Retry after ${retryAfter}s` : "Please try again later."}`,
        );
      }

      // Handle 502 Bad Gateway (temporary Moralis API issues)
      if (response.status === 502) {
        throw new Error("MORALIS_502: Moralis API temporarily unavailable. Please retry in a few moments.");
      }

      // Handle 504 Gateway Timeout
      if (response.status === 504) {
        throw new Error("MORALIS_504: Moralis API request timed out. Please retry in a few moments.");
      }

      // Handle 422 Unprocessable Entity (e.g., "Wallet has too many tokens")
      if (response.status === 422) {
        let errorBody: any = {};
        try {
          errorBody = JSON.parse(body);
        } catch {
          // Not JSON, use body as-is
        }
        throw new Error(`MORALIS_422: ${errorBody.message || body || "Unprocessable Entity"}`);
      }

      throw new Error(body || "Moralis request failed");
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors
    if (error.name === "AbortError" || error.message?.includes("timeout")) {
      throw new Error("MORALIS_TIMEOUT: Moralis API request timed out after 30 seconds. Please retry.");
    }
    
    // Re-throw other errors
    throw error;
  }
}

