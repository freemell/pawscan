import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { moralisFetch } from "@/lib/moralis-server";
import { PAW_SERVER_ERROR } from "@/lib/messages";

// Use Next.js cache for serverless compatibility (persists across function invocations)
const getCachedPortfolio = unstable_cache(
  async (address: string) => {
    return await moralisFetch(`/account/mainnet/${address}/portfolio`, {
      limit: 50, // Reduced from 200 for Free Tier
    });
  },
  ["portfolio"],
  {
    revalidate: 300, // 5 minutes cache
    tags: ["portfolio"],
  },
);

// Fallback to balances endpoint when portfolio fails with 422 (too many tokens)
const getCachedBalances = unstable_cache(
  async (address: string) => {
    return await moralisFetch(`/account/mainnet/${address}/tokens`, {
      limit: 50,
    });
  },
  ["balances"],
  {
    revalidate: 300, // 5 minutes cache
    tags: ["balances"],
  },
);

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { message: "Missing address parameter" },
      { status: 400 },
    );
  }

  try {
    const data = await getCachedPortfolio(address);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Portfolio fetch failed", error);
    const errorMsg = error.message || String(error);
    const isRateLimit = errorMsg.includes("RATE_LIMIT");
    const is502 = errorMsg.includes("MORALIS_502") || errorMsg.includes("502");
    const isTimeout = errorMsg.includes("TIMEOUT") || errorMsg.includes("timeout");
    const is404 = errorMsg.includes("404") || errorMsg.includes("not found");
    const is422 = errorMsg.includes("MORALIS_422") || errorMsg.includes("422") || errorMsg.includes("too many tokens");
    const isMissingKey = errorMsg.includes("MORALIS_API_KEY") || errorMsg.includes("Missing");
    
    // If wallet has too many tokens, fallback to balances endpoint
    if (is422) {
      try {
        console.log(`Portfolio failed with 422 for ${address}, falling back to balances endpoint`);
        const balancesData = await getCachedBalances(address) as Record<string, any>;
        // Transform balances data to match portfolio format if needed
        return NextResponse.json({
          ...(balancesData || {}),
          _fallback: true,
          _message: "This wallet has too many tokens for full portfolio analysis. Showing token balances instead.",
        });
      } catch (fallbackError: any) {
        console.error("Balances fallback also failed", fallbackError);
        // Continue to error handling below
      }
    }
    
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
    } else if (is422) {
      status = 422;
      message = "This wallet has too many tokens for portfolio analysis. Please try a different wallet or use token balances instead.";
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

