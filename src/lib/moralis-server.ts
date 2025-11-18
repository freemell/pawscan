const BASE_URL = "https://solana-gateway.moralis.io";

// Free Tier: 40K CUs/day = ~1,667 CUs/hour = ~28 CUs/minute
// Conservative estimate: ~100-500 CUs per request
// Safe rate: ~5-10 requests/minute max
const RATE_LIMIT_CACHE = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 8; // Conservative limit for Free Tier

function ensureApiKey() {
  const key = process.env.MORALIS_API_KEY;
  if (!key) {
    throw new Error("Missing MORALIS_API_KEY in environment.");
  }
  return key;
}

function checkRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - 60_000; // 1 minute window
  const key = "global";

  const requests = RATE_LIMIT_CACHE.get(key) ?? [];
  const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    // Calculate when the next request will be allowed
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((60000 - (now - oldestRequest)) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  recentRequests.push(now);
  RATE_LIMIT_CACHE.set(key, recentRequests);
  return { allowed: true };
}

export async function moralisFetch<T>(
  path: string,
  search?: Record<string, string | number | undefined>,
): Promise<T> {
  // Check rate limit before making request
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    throw new Error(
      `RATE_LIMIT_EXCEEDED: Too many requests. Please wait ${rateLimitCheck.retryAfter}s before trying again.`,
    );
  }

  const apiKey = ensureApiKey();
  const query = search
    ? "?" +
      Object.entries(search)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&")
    : "";

  const response = await fetch(`${BASE_URL}${path}${query}`, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
    next: { revalidate: 300 }, // 5 minutes cache (aggressive for Free Tier)
  });

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

    throw new Error(body || "Moralis request failed");
  }

  return (await response.json()) as T;
}

