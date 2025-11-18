"use client";

import { useMemo } from "react";
import { useKolStore } from "@/lib/state/kol-store";

export function TopGainersPanel() {
  const wallets = useKolStore((state) => state.wallets);

  const rows = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return wallets
      .filter((wallet) => {
        if (!wallet.last_tx) return false;
        const ts = new Date(wallet.last_tx).getTime();
        return !Number.isNaN(ts) && now - ts <= day;
      })
      .sort((a, b) => (b.realized_profit ?? 0) - (a.realized_profit ?? 0))
      .slice(0, 15);
  }, [wallets]);

  if (!rows.length) return null;

  return (
    <pre className="ascii-card border border-[var(--terminal-accent)] p-3 text-sm md:text-base">
{`+------+--------------------------------+--------------+---------------------+
|Rank  | Wallet                         | Realized $   | Last Tx             |
+------+--------------------------------+--------------+---------------------+`}
      {rows.map((wallet) => (
        <span key={wallet.wallet} className="block border-b border-[var(--terminal-accent)]/25 py-1">
{`
|${wallet.rank.toString().padEnd(5)}| ${wallet.wallet.padEnd(31)}| ${wallet.realized_profit.toFixed(0).padStart(11)} | ${(wallet.last_tx ?? "-").slice(0, 19).padEnd(19)} |`}
        </span>
      ))}
{`\n+------+--------------------------------+--------------+---------------------+`}
    </pre>
  );
}

