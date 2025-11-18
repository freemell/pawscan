"use client";

import { PortfolioToken } from "@/lib/types";
import { useMemo } from "react";

type Props = {
  portfolio: PortfolioToken[];
};

export function BalanceBreakdown({ portfolio }: Props) {
  const breakdown = useMemo(() => {
    if (!portfolio.length) return null;

    const totalValue = portfolio.reduce((sum, t) => sum + (Number(t.value_usd ?? 0) || 0), 0);
    
    // Separate SOL from other tokens
    const solToken = portfolio.find((t) => 
      t.mint === "So11111111111111111111111111111111111111112" || 
      t.symbol?.toUpperCase() === "SOL"
    );
    const otherTokens = portfolio.filter((t) => 
      t.mint !== "So11111111111111111111111111111111111111112" && 
      t.symbol?.toUpperCase() !== "SOL"
    );

    const solValue = Number(solToken?.value_usd ?? 0) || 0;
    const otherValue = otherTokens.reduce((sum, t) => sum + (Number(t.value_usd ?? 0) || 0), 0);

    // Group by value tiers
    const highValue = otherTokens.filter((t) => (Number(t.value_usd ?? 0) || 0) > 1000);
    const midValue = otherTokens.filter((t) => {
      const val = Number(t.value_usd ?? 0) || 0;
      return val > 100 && val <= 1000;
    });
    const lowValue = otherTokens.filter((t) => (Number(t.value_usd ?? 0) || 0) <= 100);

    return {
      totalValue,
      solValue,
      otherValue,
      solAmount: solToken ? Number(solToken.amount ?? 0) : 0,
      tokenCount: otherTokens.length,
      highValue: highValue.length,
      midValue: midValue.length,
      lowValue: lowValue.length,
      topTokens: otherTokens
        .sort((a, b) => (Number(b.value_usd ?? 0) || 0) - (Number(a.value_usd ?? 0) || 0))
        .slice(0, 5),
    };
  }, [portfolio]);

  if (!breakdown || breakdown.totalValue === 0) return null;

  return (
    <div className="ascii-card border border-[var(--terminal-accent)] p-4">
      <h3 className="text-lg text-[var(--terminal-accent)] mb-3">Balance Breakdown</h3>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-[var(--terminal-fg)]/70 mb-1">Total Portfolio</div>
            <div className="text-lg text-[var(--terminal-accent)]">
              ${breakdown.totalValue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--terminal-fg)]/70 mb-1">SOL Balance</div>
            <div className="text-base text-[var(--terminal-fg)]">
              {breakdown.solAmount.toFixed(4)} SOL
            </div>
            <div className="text-xs text-[var(--terminal-fg)]/70">
              ${breakdown.solValue.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--terminal-accent)]/30 pt-2">
          <div className="text-xs text-[var(--terminal-fg)]/70 mb-2">Token Holdings</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-[var(--terminal-accent)]">{breakdown.highValue}</div>
              <div className="text-[var(--terminal-fg)]/60">High ($1K+)</div>
            </div>
            <div>
              <div className="text-[var(--terminal-warn)]">{breakdown.midValue}</div>
              <div className="text-[var(--terminal-fg)]/60">Mid ($100-$1K)</div>
            </div>
            <div>
              <div className="text-[var(--terminal-fg)]/70">{breakdown.lowValue}</div>
              <div className="text-[var(--terminal-fg)]/60">Low (<$100)</div>
            </div>
          </div>
        </div>

        {breakdown.topTokens.length > 0 && (
          <div className="border-t border-[var(--terminal-accent)]/30 pt-2">
            <div className="text-xs text-[var(--terminal-fg)]/70 mb-1">Top Token Positions</div>
            <div className="space-y-1 text-xs">
              {breakdown.topTokens.map((token, i) => {
                const value = Number(token.value_usd ?? 0) || 0;
                const pct = (value / breakdown.totalValue) * 100;
                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[var(--terminal-fg)]">
                      {token.symbol ?? token.mint.slice(0, 6)}
                    </span>
                    <div className="text-right">
                      <div className="text-[var(--terminal-accent)]">${value.toFixed(2)}</div>
                      <div className="text-[var(--terminal-fg)]/60">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-[var(--terminal-accent)]/30 pt-2 text-xs text-[var(--terminal-fg)]/60">
          Total: {breakdown.tokenCount} token{breakdown.tokenCount !== 1 ? "s" : ""} + SOL
        </div>
      </div>
    </div>
  );
}

