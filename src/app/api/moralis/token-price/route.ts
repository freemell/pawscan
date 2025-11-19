import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { moralisFetch } from "@/lib/moralis-server";
import { PAW_SERVER_ERROR } from "@/lib/messages";

// Use Next.js cache for serverless compatibility (persists across function invocations)
const getCachedTokenPrice = unstable_cache(
  async (mint: string) => {
    return await moralisFetch(`/token/mainnet/${mint}/price`);
  },
  ["token-price"],
  {
    revalidate: 120, // 2 minutes cache (prices change frequently but not every second)
    tags: ["token-price"],
  },
);

export async function GET(request: NextRequest) {
  const mint = request.nextUrl.searchParams.get("mint");
  if (!mint) {
    return NextResponse.json(
      { message: "Missing mint parameter" },
      { status: 400 },
    );
  }

  try {
    const data = await getCachedTokenPrice(mint);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Token price fetch failed", error);
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    const is502 = error.message?.includes("MORALIS_502") || error.message?.includes("502");
    return NextResponse.json(
      {
        message: isRateLimit
          ? PAW_SERVER_ERROR
          : is502
            ? "Moralis API temporarily unavailable. Please retry in a few moments."
            : "Price uplink unavailable. Please retry shortly.",
      },
      { status: isRateLimit ? 429 : is502 ? 502 : 502 },
    );
  }
}

