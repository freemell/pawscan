import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { moralisFetch } from "@/lib/moralis-server";
import { PAW_SERVER_ERROR } from "@/lib/messages";

// Use Next.js cache for serverless compatibility (persists across function invocations)
const getCachedBalances = unstable_cache(
  async (address: string) => {
    return await moralisFetch(`/account/mainnet/${address}/tokens`, {
      limit: 50, // Reduced from 200 for Free Tier
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
    const data = await getCachedBalances(address);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Token balances fetch failed", error);
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    const is502 = error.message?.includes("MORALIS_502") || error.message?.includes("502");
    return NextResponse.json(
      {
        message: isRateLimit
          ? PAW_SERVER_ERROR
          : is502
            ? "Moralis API temporarily unavailable. Please retry in a few moments."
            : "Balance uplink unavailable. Please retry shortly.",
      },
      { status: isRateLimit ? 429 : is502 ? 502 : 502 },
    );
  }
}

