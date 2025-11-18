import { NextRequest, NextResponse } from "next/server";
import pRetry from "p-retry";

import { moralisFetch } from "@/lib/moralis-server";
import type { MoralisSwap } from "@/lib/types";

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes (aggressive caching for Free Tier)
const swapCache = new Map<string, { expires: number; payload: { result: MoralisSwap[]; isFallback: boolean } }>();
const SWAP_PROGRAM_IDS = new Set([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1zGe", // Raydium
  "JUP2jxv4Xu8JSToBPoU3sZxziWxAHXqi48A4LgdJDUf", // Jupiter
  "pumpSrmDUL4Lmo7aXstixSeKuuNHYsY9T6VwQcQgAn", // Pump.fun router (example)
  "sSwpRx87bMnKyjtGUD8Yg6AqoZG91P8pf4uTaAZ8kNa", // Meteora / Orca style
]);

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10; // Reduced for Free Tier

  if (!address) {
    return NextResponse.json({ message: "Missing address parameter" }, { status: 400 });
  }

  const cacheKey = `${address}:${limit}`;
  const cached = swapCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  try {
    const result = await fetchSwapsWithRetry(address, limit);
    const payload = { result, isFallback: false };
    swapCache.set(cacheKey, { payload, expires: Date.now() + CACHE_TTL });
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error(`Trades fetch failed for ${address}`, error);
    // Don't try fallback if it's a rate limit error
    const isRateLimit = error.message?.includes("RATE_LIMIT");
    if (isRateLimit) {
      return NextResponse.json(
        {
          message: error.message || "Daily API limit reached. Please try again tomorrow or upgrade your plan.",
        },
        { status: 429 },
      );
    }
    try {
      const fallback = await fetchTransactionsFallback(address, limit);
      const payload = { result: fallback, isFallback: true };
      swapCache.set(cacheKey, { payload, expires: Date.now() + CACHE_TTL });
      return NextResponse.json(payload);
    } catch (fallbackError: any) {
      console.error(`Transactions fallback failed for ${address}`, fallbackError);
      const isRateLimit = fallbackError.message?.includes("RATE_LIMIT");
      const is502 = fallbackError.message?.includes("MORALIS_502") || fallbackError.message?.includes("502");
      return NextResponse.json(
        {
          message: isRateLimit
            ? fallbackError.message || "Daily API limit reached. Please try again tomorrow or upgrade your plan."
            : is502
              ? "Moralis API temporarily unavailable. Please retry in a few moments."
              : "Swaps uplink unavailable. Please retry shortly.",
        },
        { status: isRateLimit ? 429 : is502 ? 502 : 502 },
      );
    }
  }
}

async function fetchSwapsWithRetry(address: string, limit: number) {
  const response = await pRetry(
    async () => {
      const data = await moralisFetch<{ result?: MoralisSwap[] }>(`/account/mainnet/${address}/trades`, {
        limit,
      });
      if (!data?.result) {
        throw new Error("Empty swaps response");
      }
      return data.result;
    },
    {
      retries: 4,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 30000,
    },
  );

  return response.slice(0, limit);
}

async function fetchTransactionsFallback(address: string, limit: number) {
  const data = await moralisFetch<{ result?: any[] }>(`/account/mainnet/${address}/transactions`, {
    limit: limit * 2,
  });
  const transactions = data?.result ?? [];
  const parsed = parseTransactionsToSwaps(transactions);
  if (!parsed.length) {
    throw new Error("No swap-like transactions found in fallback");
  }
  return parsed.slice(0, limit);
}

function parseTransactionsToSwaps(transactions: any[]): MoralisSwap[] {
  return transactions
    .map((tx) => {
      const blockTimestamp =
        tx.block_timestamp ??
        (tx.blockTime ? new Date(Number(tx.blockTime) * 1000).toISOString() : new Date().toISOString());
      const instructions: string[] =
        tx.instructions?.map((inst: any) => inst?.programId).filter(Boolean) ??
        tx.transaction?.message?.instructions?.map((inst: any) => inst?.programId).filter(Boolean) ??
        [];
      const matchesSwap = instructions.some((programId) => SWAP_PROGRAM_IDS.has(programId));
      if (!matchesSwap) return null;

      const transfers = tx.tokenTransfers ?? tx.token_transfers ?? [];
      const [firstTransfer, secondTransfer] = transfers;
      if (!firstTransfer || !secondTransfer) return null;

      return {
        signature: tx.signature ?? tx.txHash ?? "",
        block_timestamp: blockTimestamp,
        token_in: {
          mint: firstTransfer.mint ?? firstTransfer.tokenAddress ?? "",
          symbol: firstTransfer.symbol ?? firstTransfer.tokenSymbol,
          amount: Number(firstTransfer.amount ?? firstTransfer.tokenAmount ?? 0),
        },
        token_out: {
          mint: secondTransfer.mint ?? secondTransfer.tokenAddress ?? "",
          symbol: secondTransfer.symbol ?? secondTransfer.tokenSymbol,
          amount: Number(secondTransfer.amount ?? secondTransfer.tokenAmount ?? 0),
        },
        usd_value: Number(tx.value_usd ?? tx.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount ?? 0),
      } as MoralisSwap;
    })
    .filter(
      (swap): swap is MoralisSwap =>
        Boolean(
          swap &&
            swap.signature &&
            swap.token_in.mint &&
            swap.token_out.mint &&
            (swap.token_in.amount ?? 0) >= 0 &&
            (swap.token_out.amount ?? 0) >= 0,
        ),
    );
}

