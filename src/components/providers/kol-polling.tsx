"use client";

import { useEffect } from "react";
import { useKolStore } from "@/lib/state/kol-store";
import { fetchLatestSwap } from "@/lib/moralis-client";

// Free Tier: Reduced polling frequency to conserve CUs
// Poll only top 3 wallets every 5 minutes (instead of all wallets every 30s)
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_POLLED_WALLETS = 3; // Only poll top 3 to stay within Free Tier limits

export function KolPollingBridge() {
  const watchlist = useKolStore((state) => state.watchlist);
  const pushAlert = useKolStore((state) => state.pushAlert);
  const cacheSwap = useKolStore((state) => state.cacheSwap);

  useEffect(() => {
    if (!watchlist.length) return;

    // Only poll top N wallets to conserve Free Tier CUs
    const walletsToPoll = watchlist.slice(0, MAX_POLLED_WALLETS);

    const interval = setInterval(async () => {
      // Poll sequentially (not in parallel) to avoid rate limits
      for (const wallet of walletsToPoll) {
        try {
          const swap = await fetchLatestSwap(wallet);
          if (!swap) continue;
          cacheSwap(wallet, swap);
          pushAlert({
            id: `${wallet}-${swap.signature}`,
            wallet,
            symbol: swap.token_out.symbol ?? swap.token_out.mint.slice(0, 4),
            side: "buy",
            usdValue: swap.usd_value,
            timestamp: swap.block_timestamp,
          });
          // Small delay between requests to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error: any) {
          // Silently handle rate limit errors (429) - don't spam console
          if (error.message?.includes("429") || error.message?.includes("RATE_LIMIT")) {
            console.warn("Rate limit reached, pausing polling");
            break; // Stop polling if we hit rate limit
          }
          console.error("Polling error", error);
        }
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [watchlist, pushAlert, cacheSwap]);

  return null;
}

