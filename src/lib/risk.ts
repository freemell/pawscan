import type { TokenRow } from './types';

export function computeRiskScore(t: TokenRow) {
  // Heuristic: start from 0 (low risk), add for top holder, dev activity, low liquidity vs volume
  let score = 0;
  const topHolder = t.topHolderPct ?? 0.5; // 50% if unknown -> high risk
  const dev = t.devWalletActivity ?? 0.5;
  const liq = t.liquidityUsd ?? 0;
  const vol = t.volume24h ?? 0;
  const liqRatio = liq > 0 ? Math.min(1, vol / liq) : 1;

  score += topHolder * 0.5; // up to 0.5
  score += dev * 0.3; // up to 0.3
  score += liqRatio * 0.2; // up to 0.2

  let label = 'Low';
  if (score > 0.65) label = 'High';
  else if (score > 0.4) label = 'Medium';
  return { score, label };
}


