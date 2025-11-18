export type KolWallet = {
  rank: number;
  wallet: string;
  realized_profit: number;
  win_rate?: number;
  trade_count?: number;
  last_tx?: string;
};

export type MoralisSwap = {
  signature: string;
  block_timestamp: string;
  token_in: {
    mint: string;
    symbol?: string;
    amount?: number;
  };
  token_out: {
    mint: string;
    symbol?: string;
    amount?: number;
  };
  usd_value?: number;
};

export type PortfolioToken = {
  mint: string;
  symbol?: string;
  amount: number;
  value_usd?: number;
  price?: number;
};

export type TradeAlert = {
  id: string;
  wallet: string;
  symbol: string;
  side: "buy" | "sell";
  usdValue?: number;
  timestamp: string;
};

