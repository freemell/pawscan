import { NextRequest, NextResponse } from "next/server";
import { moralisFetch } from "@/lib/moralis-server";

const CACHE = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (aggressive caching for Free Tier)

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { message: "Missing address parameter" },
      { status: 400 },
    );
  }

  // Check cache first
  const cacheKey = `portfolio-${address}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const data = await moralisFetch(`/account/mainnet/${address}/portfolio`, {
      limit: 50, // Reduced from 200 for Free Tier
    });
    CACHE.set(cacheKey, { timestamp: Date.now(), data });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Portfolio fetch failed", error);
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    const is502 = error.message?.includes("MORALIS_502") || error.message?.includes("502");
    return NextResponse.json(
      {
        message: isRateLimit
          ? error.message || "Daily API limit reached. Please try again tomorrow or upgrade your plan."
          : is502
            ? "Moralis API temporarily unavailable. Please retry in a few moments."
            : "Portfolio uplink unavailable. Please retry shortly.",
      },
      { status: isRateLimit ? 429 : is502 ? 502 : 502 },
    );
  }
}

