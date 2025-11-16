import type { TokenRow } from './types';

export const defaultCatTokens: TokenRow[] = [
  { mint: 'MEW_MINT', symbol: 'MEW', name: 'Cat in a Dogs World', priceUsd: 0.005, volume24h: 1_200_000, liquidityUsd: 2_500_000, holderCount: 12000, topHolderPct: 0.12, devWalletActivity: 0.2 },
  { mint: 'POPCAT_MINT', symbol: 'POPCAT', name: 'Popcat', priceUsd: 0.016, volume24h: 2_850_000, liquidityUsd: 3_400_000, holderCount: 22000, topHolderPct: 0.08, devWalletActivity: 0.15 },
  { mint: 'MICHI_MINT', symbol: 'MICHI', name: 'Michi', priceUsd: 0.0012, volume24h: 750_000, liquidityUsd: 900_000, holderCount: 8000, topHolderPct: 0.18, devWalletActivity: 0.25 }
];

// Optional: map symbols to real Solana mint addresses for live data.
// Fill these with actual mint addresses to enable Birdeye history fetching.
export const symbolToMint: Record<string, string | undefined> = {
  // MEW: 'So11111111111111111111111111111111111111112', // example placeholder; replace with real mint
  // POPCAT: '...', // replace
  // MICHI: '...', // replace
};


