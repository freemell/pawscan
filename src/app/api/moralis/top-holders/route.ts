import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { moralisFetch } from "@/lib/moralis-server";
import { PAW_SERVER_ERROR } from "@/lib/messages";

// Use Next.js cache for serverless compatibility (persists across function invocations)
const getCachedTopHolders = unstable_cache(
  async (mint: string) => {
    return await moralisFetch(`/token/mainnet/${mint}/holders`, {
      limit: 25,
    });
  },
  ["top-holders"],
  {
    revalidate: 600, // 10 minutes cache (top holders change slowly)
    tags: ["top-holders"],
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
    const data = await getCachedTopHolders(mint);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Top holders fetch failed", error);
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    const is502 = error.message?.includes("MORALIS_502") || error.message?.includes("502");
    return NextResponse.json(
      {
        message: isRateLimit
          ? PAW_SERVER_ERROR
          : is502
            ? "Moralis API temporarily unavailable. Please retry in a few moments."
            : "Top-holder uplink unavailable. Please retry shortly.",
      },
      { status: isRateLimit ? 429 : is502 ? 502 : 502 },
    );
  }
}

