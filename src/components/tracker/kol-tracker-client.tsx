"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadKolCsv } from "@/lib/csv";
import { useKolStore } from "@/lib/state/kol-store";
import Link from "next/link";
import { getSwaps } from "@/lib/moralis-client";
import { PAW_SERVER_ERROR } from "@/lib/messages";
import { motion } from "framer-motion";
import { Monitor, RefreshCw } from "lucide-react";
import { WalletFilters } from "./wallet-filters";

const SAMPLE_WALLET = "j1oeQoPeuEDmjvyMwBmCWexzCQup77kbKKxV59CnYbd";

const PAGE_SIZE = 100;
const WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function KolTrackerClient() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["kol-wallets"],
    queryFn: loadKolCsv,
  });

  const {
    filtered,
    setWallets,
    filterWallets,
    addToWatchlist,
    watchlist,
  } = useKolStore();

  useEffect(() => {
    if (data) setWallets(data);
  }, [data, setWallets]);

  const filters = useKolStore((state) => state.filters);
  
  useEffect(() => {
    filterWallets(query);
    setPage(0);
  }, [query, filters, filterWallets]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const clampedPage = Math.min(page, totalPages - 1);
  const visibleRows = useMemo(
    () => filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE),
    [filtered, clampedPage],
  );

  const handleMonitor = async (wallet: string) => {
    if (!WALLET_REGEX.test(wallet)) {
      setStatus("That wallet address looks invalid. Please double-check and try again.");
      return;
    }
    setStatus(`Priming swaps for ${wallet.slice(0, 6)}...`);
    try {
      const result = await getSwaps(wallet, 5);
      addToWatchlist(wallet);
      setStatus(
        result.isFallback
          ? "Swaps offline—monitoring via transaction fallback."
          : `Monitoring ${wallet}`,
      );
    } catch (err: any) {
      // Use console.warn instead of console.error to avoid triggering React error overlay
      // The error is being handled gracefully below
      console.warn("Monitor error (handled):", err);
      
      // Extract error message from various possible formats
      let errorMsg = "";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      } else if (err?.error?.message) {
        errorMsg = err.error.message;
      } else {
        errorMsg = String(err);
      }
      
      // Normalize error message for matching
      const normalizedMsg = errorMsg.toLowerCase();
      
      // Handle different error types with specific messages
      if (
        normalizedMsg.includes("429") ||
        normalizedMsg.includes("rate_limit") ||
        normalizedMsg.includes("rate limit") ||
        normalizedMsg.includes("limit reached") ||
        normalizedMsg.includes("daily limit")
      ) {
        setStatus(PAW_SERVER_ERROR);
      } else if (
        normalizedMsg.includes("502") ||
        normalizedMsg.includes("unavailable") ||
        normalizedMsg.includes("bad gateway") ||
        normalizedMsg.includes("temporarily unavailable")
      ) {
        setStatus("Moralis API temporarily unavailable. Please retry in a few moments.");
      } else {
        // Fallback: show the actual error message or a generic one
        setStatus(errorMsg || "Couldn't warm the trade feed. Give it another try in a moment.");
      }
    }
  };

  return (
    <div className="space-y-4">
      <WalletFilters />
      <header className="ascii-card border border-[var(--terminal-accent)] p-4">
        <h1 className="text-2xl text-[var(--terminal-accent)]">Smart Trader Tracker</h1>
        <p className="text-base">
          all profitable Solana smart trader wallets (influencers + off-radar grinders) loaded from the paws system. Click
          any wallet to open the intel page or hit <code>[Monitor]</code> to add it to the live activity feed. Watchlist:{" "}
          <span className="text-[var(--terminal-warn)]">{watchlist.length}</span>
          <span className="block text-sm text-[var(--terminal-fg)]">
            Showing batch {clampedPage + 1}/{totalPages} ({visibleRows.length} of {filtered.length} wallets)
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wallet / rank..."
            className="w-full max-w-sm border border-[var(--terminal-accent)] bg-black px-2 py-1 text-[var(--terminal-fg)]"
          />
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 border border-[var(--terminal-accent)] px-3 py-1 text-sm"
          >
            <RefreshCw size={14} /> Reload Pawallets
          </button>
          <button
            onClick={() => handleMonitor(SAMPLE_WALLET)}
            className="inline-flex items-center gap-2 border border-[var(--terminal-warn)] px-3 py-1 text-sm text-[var(--terminal-warn)]"
          >
            <Monitor size={14} /> Monitor sample wallet
          </button>
        </div>
        {status && <p className="text-[var(--terminal-warn)]">{status}</p>}
      </header>

      {isPending && (
        <motion.div
          className="ascii-card border border-[var(--terminal-accent)] p-4 text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading wallets from Paw snapshot...
        </motion.div>
      )}
      {error && (
        <div className="ascii-card border border-[var(--terminal-danger)] p-4 text-[var(--terminal-danger)]">
          Failed to load CSV. Ensure <code>dune_query_4032586.csv</code> is in <code>/public</code>.
        </div>
      )}

      {!isPending && !error && (
        <pre className="ascii-card border border-[var(--terminal-accent)] p-3 text-sm md:text-base">
{`+------+--------------------------------+--------------+----------+----------------+
|Rank  | Wallet                         | Realized $   | WinRate  | Actions        |
+------+--------------------------------+--------------+----------+----------------+`}
          {visibleRows.map((wallet) => (
            <span key={wallet.wallet} className="block border-b border-[var(--terminal-accent)]/30 py-1">
{`
|${wallet.rank.toString().padEnd(5)}| ${wallet.wallet.padEnd(31)}| ${wallet.realized_profit.toFixed(0).padStart(11)} | ${(wallet.win_rate ?? 0).toFixed(2).padStart(7)} | `}
              <Link
                href={`/wallet/${wallet.wallet}`}
                className="text-[var(--terminal-accent)] underline"
              >
                view
              </Link>
              {" | "}
              <button
                onClick={() => handleMonitor(wallet.wallet)}
                className="text-[var(--terminal-warn)] underline"
              >
                monitor
              </button>
{` |`}
            </span>
          ))}
{`\n+------+--------------------------------+--------------+----------+----------------+`}
        </pre>
      )}
      {!isPending && !error && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="border border-[var(--terminal-accent)] px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={clampedPage >= totalPages - 1}
            className="border border-[var(--terminal-accent)] px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
          <span className="text-sm text-[var(--terminal-fg)]">
            Page {clampedPage + 1} / {totalPages} · Wallets {(clampedPage * PAGE_SIZE) + 1}-
            {Math.min((clampedPage + 1) * PAGE_SIZE, filtered.length)}
          </span>
        </div>
      )}
    </div>
  );
}

