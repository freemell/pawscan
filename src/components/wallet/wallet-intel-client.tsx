"use client";

import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getSwaps, getTokenTopHolders, getTokenPrice } from "@/lib/moralis-client";
import { PortfolioToken, MoralisSwap } from "@/lib/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import { useKolStore } from "@/lib/state/kol-store";
import { DyorPanel } from "./dyor-panel";
import { CopyTradeCalculator } from "./copy-trade-calculator";
import { BalanceBreakdown } from "./balance-breakdown";

type Props = {
  address: string;
};

export function WalletIntelClient({ address }: Props) {
  const addToWatchlist = useKolStore((state) => state.addToWatchlist);

  const {
    data: portfolio,
    isPending: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => getPortfolio(address),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
  });

  const {
    data: swapData,
    isPending: swapsLoading,
    error: swapsError,
    refetch: refetchSwaps,
  } = useQuery({
    queryKey: ["swaps", address],
    queryFn: () => getSwaps(address, 10), // Reduced for Free Tier
    refetchInterval: false, // Disabled auto-refetch to conserve CUs (user can manually refresh)
    retry: 2, // Reduced retries for Free Tier
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const swaps = swapData?.swaps ?? [];
  const swapsFallbackActive = Boolean(swapData?.isFallback);

  const topHoldingMint = portfolio?.[0]?.mint;
  const { data: holderData } = useQuery({
    queryKey: ["holders", topHoldingMint],
    queryFn: () => (topHoldingMint ? getTokenTopHolders(topHoldingMint) : Promise.resolve({ result: [] })),
    enabled: Boolean(topHoldingMint),
  });

  const { data: tokenMeta } = useQuery({
    queryKey: ["token-meta", topHoldingMint],
    queryFn: () => (topHoldingMint ? getTokenPrice(topHoldingMint) : Promise.resolve({})),
    enabled: Boolean(topHoldingMint),
  });

  const holdingsChart = buildHoldingsChart(portfolio);
  const swapsChart = buildSwapsChart(swaps);

  return (
    <div className="space-y-4">
      <header className="ascii-card border border-[var(--terminal-accent)] p-4">
        <h1 className="text-2xl text-[var(--terminal-accent)]">Wallet Intel</h1>
        <div className="text-sm text-[var(--terminal-fg)]">Address: {address}</div>
        <button
          onClick={() => addToWatchlist(address)}
          className="mt-2 border border-[var(--terminal-warn)] px-3 py-1 text-[var(--terminal-warn)]"
        >
          Monitor Live Activity
        </button>
      </header>

      {(portfolioLoading || swapsLoading) && (
        <motion.div
          className="ascii-card border border-[var(--terminal-accent)] p-4 text-center"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          Syncing PawScan intel stream...
        </motion.div>
      )}

      {(portfolioError || swapsError) && (
        <div className="ascii-card border border-[var(--terminal-danger)] p-4 text-[var(--terminal-danger)] space-y-3">
          <div>
            {portfolioError && (
              <div>
                {portfolioError.message?.includes("429") || portfolioError.message?.includes("limit")
                  ? "Daily API limit reached. Please try again tomorrow or upgrade your plan."
                  : "Portfolio uplink is snoozing. Please retry in a few moments."}
              </div>
            )}
            {swapsError && (
              <div>
                {swapsError.message?.includes("429") || swapsError.message?.includes("limit")
                  ? "Daily API limit reached. Please try again tomorrow or upgrade your plan."
                  : "Swaps feed jammed. Moralis swaps service might be temporarily down—fallback transactions will kick in when possible."}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              refetchPortfolio();
              refetchSwaps();
            }}
            className="border border-[var(--terminal-danger)] px-3 py-1 text-sm text-[var(--terminal-danger)]"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {portfolio && portfolio.length > 0 && (
        <section className="ascii-card border border-[var(--terminal-accent)] p-4">
          <h2 className="text-xl text-[var(--terminal-accent)]">Holdings Snapshot</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={holdingsChart}>
              <XAxis dataKey="name" hide tick={{ fill: "#00ff7f" }} />
              <YAxis tick={{ fill: "#00ff7f" }} />
              <Tooltip />
              <Bar dataKey="usd" fill="#00ff7f" />
            </BarChart>
          </ResponsiveContainer>
          <AsciiTable
            headers={["Token", "Amount", "USD"]}
            rows={portfolio.slice(0, 15).map((token) => [
              token.symbol ?? token.mint.slice(0, 6),
              formatNumber(token.amount, 2),
              `$${formatNumber(token.value_usd, 2)}`,
            ])}
          />
        </section>
      )}

      {!swapsLoading && !swapsError && swaps.length === 0 && (
        <div className="ascii-card border border-[var(--terminal-accent)] p-4 text-sm text-[var(--terminal-fg)]">
          No trades found for this wallet. Moralis Solana swaps cover on-chain activity from Sep 2024 onward—older
          transactions may require the fallback explorer.
        </div>
      )}

      {swaps && swaps.length > 0 && (
        <section className="ascii-card border border-[var(--terminal-accent)] p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl text-[var(--terminal-accent)]">
              {swapsFallbackActive ? "Recent Transactions (Fallback Mode)" : "Recent Trades"}
            </h2>
            {swapsFallbackActive && (
              <p className="text-sm text-[var(--terminal-warn)]">
                Moralis swaps endpoint is down—showing parsed transactions instead. Amounts may be approximate.
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={swapsChart}>
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fill: "#00ff7f" }} />
              <Tooltip />
              <Line type="monotone" dataKey="usd" stroke="#00ff7f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <AsciiTable
            headers={["Time", "Pair", "USD"]}
            rows={swaps.slice(0, 15).map((swap) => [
              new Date(swap.block_timestamp).toLocaleString(),
              `${symbolOf(swap.token_in)}→${symbolOf(swap.token_out)}`,
              `$${(swap.usd_value ?? 0).toFixed(2)}`,
            ])}
          />
        </section>
      )}

      {portfolio && portfolio.length > 0 && (
        <BalanceBreakdown portfolio={portfolio} />
      )}

      <TradeSimulator swaps={swaps ?? []} />
      <CopyTradeCalculator swaps={swaps ?? []} />
      <MemeBadge swaps={swaps ?? []} tokenMeta={tokenMeta} />
      
      {portfolio && portfolio.length > 0 && swaps.length > 0 && (
        <DyorPanel
          portfolio={portfolio}
          swaps={swaps}
          tokenMeta={tokenMeta}
          topHolders={holderData?.result}
        />
      )}

      <TopHoldersPanel holders={holderData?.result ?? []} />
    </div>
  );
}

function symbolOf(token?: { symbol?: string; mint: string }) {
  if (!token) return "??";
  return token.symbol ?? token.mint.slice(0, 4);
}

function buildHoldingsChart(tokens?: PortfolioToken[]) {
  if (!tokens) return [];
  return tokens.slice(0, 10).map((token) => ({
    name: token.symbol ?? token.mint.slice(0, 5),
    usd: Number(token.value_usd ?? 0) || 0,
  }));
}

function buildSwapsChart(swaps?: MoralisSwap[]) {
  if (!swaps) return [];
  return swaps.slice(0, 30).map((swap) => ({
    name: new Date(swap.block_timestamp).toLocaleTimeString(),
    usd: Number(swap.usd_value ?? 0) || 0,
  }));
}

function AsciiTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const widths = headers.map((header, idx) =>
    Math.max(header.length, ...rows.map((row) => row[idx]?.length ?? 0)),
  );
  const renderRow = (row: string[]) =>
    `| ${row
      .map((cell, idx) => cell.padEnd(widths[idx]))
      .join(" | ")} |`;
  const horizontal = `+${widths.map((w) => "-".repeat(w + 2)).join("+")}+`;

  return (
    <pre className="mt-3 text-sm">
      {horizontal}
      {"\n"}
      {renderRow(headers)}
      {"\n"}
      {horizontal}
      {"\n"}
      {rows.map((row, index) => (
        <span key={index}>
          {renderRow(row)}
          {"\n"}
        </span>
      ))}
      {horizontal}
    </pre>
  );
}

function TradeSimulator({ swaps }: { swaps: MoralisSwap[] }) {
  if (!swaps.length) return null;
  const sample = swaps.slice(0, 20);
  const pnl =
    sample.reduce((acc, trade) => acc + (Number(trade.usd_value ?? 0) || 0), 0) /
    Math.max(sample.length, 1);
  return (
    <div className="ascii-card border border-[var(--terminal-warn)] p-4">
      <h3 className="text-lg text-[var(--terminal-warn)]">Trade Simulator</h3>
      <p>
        Average USD allocation over last {sample.length} trades:{" "}
        <span className="text-[var(--terminal-accent)]">${pnl.toFixed(2)}</span>. Use this to size
        copy-trades responsibly.
      </p>
    </div>
  );
}

function MemeBadge({
  swaps,
  tokenMeta,
}: {
  swaps: MoralisSwap[];
  tokenMeta?: { usdPrice?: number; marketCap?: number };
}) {
  const memeHits = swaps.filter((swap) => isMemeSymbol(symbolOf(swap.token_out)));
  const lowCap = tokenMeta?.marketCap && tokenMeta.marketCap < 5_000_000;
  if (!memeHits.length && !lowCap) return null;
  return (
    <div className="ascii-card border border-[var(--terminal-accent)] p-4">
      <h3 className="text-lg text-[var(--terminal-accent)]">Meme Coin Activity</h3>
      <p>
        Meme trades detected in last 24h: {memeHits.length}. {lowCap && "Top holding under $5M cap."}
      </p>
    </div>
  );
}

function TopHoldersPanel({
  holders,
}: {
  holders: Array<{ address: string; percentage: number }>;
}) {
  if (!holders.length) return null;
  return (
    <div className="ascii-card border border-[var(--terminal-accent)] p-4">
      <h3 className="text-lg text-[var(--terminal-accent)]">Top Holders Cross-Check</h3>
      <AsciiTable
        headers={["Holder", "% Supply"]}
        rows={holders.slice(0, 10).map((holder) => [
          holder.address.slice(0, 16) + "...",
          holder.percentage.toFixed(2),
        ])}
      />
    </div>
  );
}

function isMemeSymbol(symbol: string) {
  const lower = symbol.toLowerCase();
  return ["cat", "dog", "meme", "pepe", "paw", "pump", "frog", "sol"].some((key) =>
    lower.includes(key),
  );
}

function formatNumber(value: number | string | undefined, digits = 2) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(digits);
}

