"use client";

import type { MoralisSwap, PortfolioToken } from "./types";

type SwapsResponse = {
  swaps: MoralisSwap[];
  isFallback: boolean;
};

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    let errorMessage = text || "Request failed";
    
    // Try to parse JSON error response first
    try {
      const json = JSON.parse(text);
      if (json.message) {
        errorMessage = json.message;
      }
    } catch {
      // Not JSON, use text as-is
    }
    
    // Handle 429 rate limit errors specifically
    if (response.status === 429) {
      if (!errorMessage.includes("limit") && !errorMessage.includes("429")) {
        errorMessage = errorMessage || "Daily API limit reached. Please try again tomorrow or upgrade your plan.";
      }
    }
    
    // Handle 502 Bad Gateway errors
    if (response.status === 502) {
      if (!errorMessage.includes("unavailable") && !errorMessage.includes("502")) {
        errorMessage = errorMessage || "Moralis API temporarily unavailable. Please retry in a few moments.";
      }
    }
    
    // Handle 504 Gateway Timeout errors
    if (response.status === 504) {
      if (!errorMessage.includes("timeout") && !errorMessage.includes("504")) {
        errorMessage = errorMessage || "Moralis API request timed out. Please retry in a few moments.";
      }
    }
    
    // Handle 404 Not Found errors
    if (response.status === 404) {
      if (!errorMessage.includes("not found") && !errorMessage.includes("404")) {
        errorMessage = errorMessage || "Endpoint not available. This resource may not be supported.";
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export async function getPortfolio(address: string) {
  const data = await fetchJson<{ tokens?: PortfolioToken[] }>(
    `/api/moralis/portfolio?address=${encodeURIComponent(address)}`,
  );
  return data.tokens ?? [];
}

export async function getSwaps(address: string, limit = 10): Promise<SwapsResponse> {
  trackMoralisCall("swaps");
  const data = await fetchJson<{ result?: MoralisSwap[]; isFallback?: boolean }>(
    `/api/moralis/swaps?address=${encodeURIComponent(address)}&limit=${limit}`,
  );
  return {
    swaps: data.result ?? [],
    isFallback: Boolean(data.isFallback),
  };
}

export async function fetchLatestSwap(address: string) {
  const { swaps } = await getSwaps(address, 1);
  return swaps[0];
}

export async function getTokenTopHolders(mint: string) {
  return await fetchJson<{
    result?: Array<{ address: string; percentage: number; amount: number }>;
  }>(`/api/moralis/top-holders?mint=${encodeURIComponent(mint)}`);
}

export async function getTokenPrice(mint: string) {
  return await fetchJson<{ usdPrice?: number; marketCap?: number }>(
    `/api/moralis/token-price?mint=${encodeURIComponent(mint)}`,
  );
}

function trackMoralisCall(namespace: string) {
  if (typeof window === "undefined") return;
  const todayKey = `pawscan-moralis-calls-${new Date().toISOString().slice(0, 10)}`;
  const raw = window.localStorage.getItem(todayKey);
  const nextValue = (raw ? Number(raw) : 0) + 1;
  window.localStorage.setItem(todayKey, String(nextValue));

  if (nextValue >= 800) {
    const warnKey = `${todayKey}-warned`;
    if (!window.sessionStorage.getItem(warnKey)) {
      console.warn("Approaching Moralis daily quota (~1000 calls). Consider upgrading the plan.");
      window.sessionStorage.setItem(warnKey, "1");
    }
  }
}

