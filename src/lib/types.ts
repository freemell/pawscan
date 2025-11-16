export type TokenRow = {
  mint: string;
  symbol: string;
  name: string;
  priceUsd?: number;
  volume24h?: number;
  liquidityUsd?: number;
  holderCount?: number;
  topHolderPct?: number;
  devWalletActivity?: number; // heuristic 0..1
};

export type Holding = {
  mint: string;
  symbol: string;
  balance: number;
  usdValue?: number;
};


