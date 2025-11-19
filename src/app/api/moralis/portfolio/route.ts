import { NextRequest, NextResponse } from "next/server";
import { moralisFetch } from "@/lib/moralis-server";
import { PAW_SERVER_ERROR } from "@/lib/messages";

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
    const errorMsg = error.message || String(error);
    const isRateLimit = errorMsg.includes("RATE_LIMIT");
    const is502 = errorMsg.includes("MORALIS_502") || errorMsg.includes("502");
    const isTimeout = errorMsg.includes("TIMEOUT") || errorMsg.includes("timeout");
    const is404 = errorMsg.includes("404") || errorMsg.includes("not found");
    const isMissingKey = errorMsg.includes("MORALIS_API_KEY") || errorMsg.includes("Missing");
    
    let status = 502;
    let message = "Portfolio uplink unavailable. Please retry shortly.";
    
    if (isMissingKey) {
      status = 500;
      message = "Server configuration error: Missing API key. Please configure MORALIS_API_KEY in Vercel environment variables.";
    } else if (isRateLimit) {
      status = 429;
      message = PAW_SERVER_ERROR;
    } else if (isTimeout) {
      status = 504;
      message = "Moralis API request timed out. Please retry in a few moments.";
    } else if (is404) {
      status = 404;
      message = "Portfolio endpoint not available. This wallet may not be supported.";
    } else if (is502) {
      status = 502;
      message = "Moralis API temporarily unavailable. Please retry in a few moments.";
    }
    
    return NextResponse.json(
      { message },
      { status },
    );
  }
}

