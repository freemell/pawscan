"use client";

import { PortfolioToken, MoralisSwap } from "@/lib/types";
import { useMemo } from "react";

type Props = {
  portfolio: PortfolioToken[];
  swaps: MoralisSwap[];
  tokenMeta?: { usdPrice?: number; marketCap?: number; totalSupply?: number };
  topHolders?: Array<{ address: string; percentage: number; amount?: number }>;
};

export function DyorPanel({ portfolio, swaps, tokenMeta, topHolders }: Props) {
  const topToken = portfolio[0];
  if (!topToken) return null;

  const analysis = useMemo(() => {
    const totalValue = portfolio.reduce((sum, t) => sum + (Number(t.value_usd ?? 0) || 0), 0);
    const topTokenValue = Number(topToken.value_usd ?? 0) || 0;
    const concentration = totalValue > 0 ? (topTokenValue / totalValue) * 100 : 0;

    // Analyze swaps for this token
    const tokenSwaps = (swaps || []).filter(
      (s) => s.token_out.mint === topToken.mint || s.token_in.mint === topToken.mint,
    );
    const recentSwaps = tokenSwaps.filter((s) => {
      const swapTime = new Date(s.block_timestamp).getTime();
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return swapTime > dayAgo;
    });

    // Calculate holder concentration risk
    const top5Concentration =
      topHolders?.slice(0, 5).reduce((sum, h) => sum + (h.percentage ?? 0), 0) ?? 0;
    const top10Concentration =
      topHolders?.slice(0, 10).reduce((sum, h) => sum + (h.percentage ?? 0), 0) ?? 0;

    // Risk indicators
    const risks: string[] = [];
    if (concentration > 50) risks.push("High portfolio concentration");
    if (top5Concentration > 40) risks.push("Top 5 holders control >40%");
    if (top10Concentration > 60) risks.push("Top 10 holders control >60%");
    if ((tokenMeta?.marketCap ?? 0) < 1_000_000) risks.push("Low market cap (<$1M)");
    if ((tokenMeta?.marketCap ?? 0) < 100_000) risks.push("Micro cap (<$100K)");
    if (recentSwaps.length === 0 && (swaps?.length ?? 0) > 0) risks.push("No recent activity (24h)");

    const positives: string[] = [];
    if (concentration < 30) positives.push("Diversified portfolio");
    if (top5Concentration < 20) positives.push("Distributed holder base");
    if ((tokenMeta?.marketCap ?? 0) > 10_000_000) positives.push("Established market cap");
    if (recentSwaps.length > 5) positives.push("Active trading (24h)");

    return {
      concentration,
      top5Concentration,
      top10Concentration,
      recentSwaps: recentSwaps.length,
      totalSwaps: tokenSwaps.length,
      risks,
      positives,
    };
  }, [portfolio, swaps, topHolders]);

  return (
    <div className="ascii-card border border-[var(--terminal-accent)] p-4">
      <h3 className="text-lg text-[var(--terminal-accent)] mb-3">DYOR Panel</h3>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-[var(--terminal-fg)] mb-1">
            Top Holding: <span className="text-[var(--terminal-accent)]">{topToken.symbol ?? topToken.mint.slice(0, 8)}</span>
          </div>
          <div className="text-xs text-[var(--terminal-fg)]/70">
            Portfolio Concentration: {analysis.concentration.toFixed(1)}%
          </div>
        </div>

        {tokenMeta && (
          <div className="border-t border-[var(--terminal-accent)]/30 pt-2">
            <div className="text-[var(--terminal-fg)] mb-1">Token Metrics</div>
            <div className="text-xs space-y-1 text-[var(--terminal-fg)]/70">
              {(() => {
                // Use provided market cap if available
                if (tokenMeta.marketCap) {
                  return <div>Market Cap: ${(tokenMeta.marketCap / 1_000_000).toFixed(2)}M</div>;
                }
                
                // Calculate market cap from price × supply if both available
                if (tokenMeta.usdPrice && tokenMeta.totalSupply) {
                  const calculatedMarketCap = tokenMeta.usdPrice * tokenMeta.totalSupply;
                  return <div>Market Cap: ${(calculatedMarketCap / 1_000_000).toFixed(2)}M</div>;
                }
                
                // Try to estimate from top holders if we have price and holder data
                if (tokenMeta.usdPrice && topHolders && topHolders.length > 0) {
                  const topHolder = topHolders[0];
                  if (topHolder.percentage && topHolder.amount) {
                    // Estimate total supply from top holder: supply = topHolderAmount / (percentage / 100)
                    const estimatedSupply = topHolder.amount / (topHolder.percentage / 100);
                    const estimatedMarketCap = tokenMeta.usdPrice * estimatedSupply;
                    return <div>Market Cap: ~${(estimatedMarketCap / 1_000_000).toFixed(2)}M (est.)</div>;
                  }
                }
                
                // Try to calculate from portfolio token price if available
                if (tokenMeta.usdPrice && topToken) {
                  const tokenAmount = Number(topToken.amount ?? 0);
                  const tokenValue = Number(topToken.value_usd ?? 0);
                  
                  // If we have both value and amount, we can verify the price
                  // But we still need supply to calculate market cap
                  // Without supply, we can't calculate accurately
                  return null;
                }
                
                return null;
              })()}
            </div>
          </div>
        )}

        {analysis.top5Concentration > 0 && (
          <div className="border-t border-[var(--terminal-accent)]/30 pt-2">
            <div className="text-[var(--terminal-fg)] mb-1">Holder Distribution</div>
            <div className="text-xs space-y-1 text-[var(--terminal-fg)]/70">
              <div>Top 5: {analysis.top5Concentration.toFixed(1)}%</div>
              <div>Top 10: {analysis.top10Concentration.toFixed(1)}%</div>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--terminal-accent)]/30 pt-2">
          <div className="text-[var(--terminal-fg)] mb-1">Activity (24h)</div>
          <div className="text-xs text-[var(--terminal-fg)]/70">
            {analysis.recentSwaps} swaps detected
          </div>
        </div>

        {analysis.risks.length > 0 && (
          <div className="border-t border-[var(--terminal-danger)]/50 pt-2">
            <div className="text-[var(--terminal-danger)] mb-1 font-bold">⚠️ Risk Flags</div>
            <ul className="text-xs space-y-1 text-[var(--terminal-danger)]/80 list-disc list-inside">
              {analysis.risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.positives.length > 0 && (
          <div className="border-t border-[var(--terminal-accent)]/50 pt-2">
            <div className="text-[var(--terminal-accent)] mb-1 font-bold">✓ Positive Signals</div>
            <ul className="text-xs space-y-1 text-[var(--terminal-accent)]/80 list-disc list-inside">
              {analysis.positives.map((pos, i) => (
                <li key={i}>{pos}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-[var(--terminal-warn)]/50 pt-2 text-xs text-[var(--terminal-warn)]/70">
          Always DYOR. This panel analyzes on-chain data only—verify token legitimacy independently.
        </div>
      </div>
    </div>
  );
}

