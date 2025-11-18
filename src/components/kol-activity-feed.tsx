"use client";

import { useKolStore } from "@/lib/state/kol-store";

export function KolActivityFeed() {
  const alerts = useKolStore((state) => state.alerts);

  if (!alerts.length) {
    return (
      <div className="ascii-card border border-[var(--terminal-warn)] p-4 text-[var(--terminal-warn)]">
        No live smart-trader activity yet. Add wallets from the tracker to kick off monitoring.
      </div>
    );
  }

  return (
    <pre className="ascii-card border border-[var(--terminal-accent)] p-3 text-sm md:text-base">
{`+----------------------+--------------------------------+--------+-------+--------------+
| Time                 | Wallet                         | Symbol | Side  | USD          |
+----------------------+--------------------------------+--------+-------+--------------+`}
      {alerts.slice(0, 100).map((alert) => (
        <span key={alert.id} className="block border-b border-[var(--terminal-accent)]/30 py-1">
{`
| ${new Date(alert.timestamp).toLocaleString().padEnd(20)} | ${alert.wallet.padEnd(30)} | ${(alert.symbol ?? "??").padEnd(6)} | ${alert.side.toUpperCase().padEnd(5)} | ${(alert.usdValue ?? 0).toFixed(2).padStart(10)} |`}
        </span>
      ))}
{`\n+----------------------+--------------------------------+--------+-------+--------------+`}
    </pre>
  );
}

