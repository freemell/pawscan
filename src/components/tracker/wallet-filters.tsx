"use client";

import { useState } from "react";
import { useKolStore } from "@/lib/state/kol-store";

export function WalletFilters() {
  const filters = useKolStore((state) => state.filters);
  const setFilters = useKolStore((state) => state.setFilters);
  const [minProfit, setMinProfit] = useState(filters.minProfit ?? 0);
  const [minWinRate, setMinWinRate] = useState(filters.minWinRate ?? 0);
  const [activeOnly, setActiveOnly] = useState(filters.activeOnly ?? false);

  const applyFilters = () => {
    setFilters({
      minProfit: minProfit > 0 ? minProfit : undefined,
      minWinRate: minWinRate > 0 ? minWinRate : undefined,
      activeOnly: activeOnly || undefined,
    });
  };

  const resetFilters = () => {
    setMinProfit(0);
    setMinWinRate(0);
    setActiveOnly(false);
    setFilters({});
  };

  return (
    <div className="ascii-card border border-[var(--terminal-accent)] p-3 mb-4">
      <h3 className="text-lg text-[var(--terminal-accent)] mb-3">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <div>
          <label className="block text-xs text-[var(--terminal-fg)]/70 mb-1">
            Min Profit ($)
          </label>
          <input
            type="number"
            value={minProfit}
            onChange={(e) => setMinProfit(Number(e.target.value) || 0)}
            className="w-full border border-[var(--terminal-accent)] bg-black px-2 py-1 text-[var(--terminal-fg)]"
            min="0"
            step="1000"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--terminal-fg)]/70 mb-1">
            Min Win Rate (%)
          </label>
          <input
            type="number"
            value={minWinRate}
            onChange={(e) => setMinWinRate(Number(e.target.value) || 0)}
            className="w-full border border-[var(--terminal-accent)] bg-black px-2 py-1 text-[var(--terminal-fg)]"
            min="0"
            max="100"
            step="1"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-[var(--terminal-fg)]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="border border-[var(--terminal-accent)]"
            />
            Active (24h)
          </label>
        </div>
        <div className="flex gap-2 items-end">
          <button
            onClick={applyFilters}
            className="flex-1 border border-[var(--terminal-accent)] px-3 py-1 text-[var(--terminal-accent)] hover:bg-[var(--terminal-accent)]/10"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="flex-1 border border-[var(--terminal-fg)]/50 px-3 py-1 text-[var(--terminal-fg)]/70 hover:bg-[var(--terminal-fg)]/10"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

