"use client";

import { useState, useMemo } from "react";
import { MoralisSwap } from "@/lib/types";

type Props = {
  swaps: MoralisSwap[];
};

export function CopyTradeCalculator({ swaps }: Props) {
  const [riskPercent, setRiskPercent] = useState(2); // % of capital to risk per trade
  const [capital, setCapital] = useState(1000); // Total capital

  const stats = useMemo(() => {
    if (!swaps.length) return null;

    const recentSwaps = swaps.slice(0, 20);
    const avgTradeSize = recentSwaps.reduce((sum, s) => sum + (Number(s.usd_value ?? 0) || 0), 0) / recentSwaps.length;
    const maxTradeSize = Math.max(...recentSwaps.map((s) => Number(s.usd_value ?? 0) || 0));
    const minTradeSize = Math.min(...recentSwaps.map((s) => Number(s.usd_value ?? 0) || 0));

    // Calculate recommended position size
    const riskAmount = (capital * riskPercent) / 100;
    const recommendedSize = Math.min(riskAmount, avgTradeSize * 0.5); // Conservative: 50% of their avg

    return {
      avgTradeSize,
      maxTradeSize,
      minTradeSize,
      recommendedSize,
      riskAmount,
    };
  }, [swaps, riskPercent, capital]);

  if (!swaps.length || !stats) return null;

  return (
    <div className="ascii-card border border-[var(--terminal-warn)] p-4">
      <h3 className="text-lg text-[var(--terminal-warn)] mb-3">Copy-Trade Calculator</h3>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--terminal-fg)]/70 mb-1">
              Your Capital ($)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value) || 0)}
              className="w-full border border-[var(--terminal-accent)] bg-black px-2 py-1 text-[var(--terminal-fg)] text-sm"
              min="0"
              step="100"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--terminal-fg)]/70 mb-1">
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Math.min(10, Math.max(0.1, Number(e.target.value) || 0)))}
              className="w-full border border-[var(--terminal-accent)] bg-black px-2 py-1 text-[var(--terminal-fg)] text-sm"
              min="0.1"
              max="10"
              step="0.5"
            />
          </div>
        </div>

        <div className="border-t border-[var(--terminal-accent)]/30 pt-2 space-y-2">
          <div className="text-[var(--terminal-fg)]">
            <div className="text-xs text-[var(--terminal-fg)]/70 mb-1">Trader Stats (Last 20 Trades)</div>
            <div className="text-xs space-y-1 text-[var(--terminal-fg)]/80">
              <div>Avg Trade: ${stats.avgTradeSize.toFixed(2)}</div>
              <div>Max Trade: ${stats.maxTradeSize.toFixed(2)}</div>
              <div>Min Trade: ${stats.minTradeSize.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--terminal-warn)]/50 pt-2">
          <div className="text-[var(--terminal-warn)] font-bold mb-1">Recommended Position</div>
          <div className="text-lg text-[var(--terminal-accent)]">
            ${stats.recommendedSize.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--terminal-fg)]/70 mt-1">
            Based on {riskPercent}% risk of ${capital.toFixed(2)} capital
          </div>
        </div>

        <div className="border-t border-[var(--terminal-accent)]/30 pt-2 text-xs text-[var(--terminal-fg)]/60">
          ⚠️ This is a sizing guide only. Never risk more than you can afford to lose. Past performance ≠ future results.
        </div>
      </div>
    </div>
  );
}

