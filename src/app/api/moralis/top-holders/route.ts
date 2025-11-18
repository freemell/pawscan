import { NextRequest, NextResponse } from "next/server";
import { moralisFetch } from "@/lib/moralis-server";

const CACHE = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (top holders change slowly)

export async function GET(request: NextRequest) {
  const mint = request.nextUrl.searchParams.get("mint");
  if (!mint) {
    return NextResponse.json(
      { message: "Missing mint parameter" },
      { status: 400 },
    );
  }

  // Check cache first
  const cacheKey = `holders-${mint}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const data = await moralisFetch(`/token/mainnet/${mint}/holders`, {
      limit: 25,
    });
    CACHE.set(cacheKey, { timestamp: Date.now(), data });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Top holders fetch failed", error);
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    const is502 = error.message?.includes("MORALIS_502") || error.message?.includes("502");
    return NextResponse.json(
      {
        message: isRateLimit
          ? error.message || "Daily API limit reached. Please try again tomorrow or upgrade your plan."
          : is502
            ? "Moralis API temporarily unavailable. Please retry in a few moments."
            : "Top-holder uplink unavailable. Please retry shortly.",
      },
      { status: isRateLimit ? 429 : is502 ? 502 : 502 },
    );
  }
}

