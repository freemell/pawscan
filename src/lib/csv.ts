import Papa from "papaparse";
import { KolWallet } from "./types";

let cache: KolWallet[] | null = null;

export async function loadKolCsv(): Promise<KolWallet[]> {
  if (cache) return cache;
  const response = await fetch("/dune_query_4032586.csv");
  if (!response.ok) {
    throw new Error("Unable to load smart-trader CSV feed.");
  }
  const text = await response.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  cache =
    parsed.data
      ?.map((row) => ({
        rank: Number(row.rank ?? row.Rank ?? 0),
        wallet:
          row.wallet ?? row.wallet_address ?? row.wallet_addr ?? row.Wallet ?? "",
        realized_profit: Number(
          row.realized_profit ??
            row.realized_profit_usd ??
            row.realized_profit_usd__sum ??
            0,
        ),
        win_rate: row.win_rate ? Number(row.win_rate) : undefined,
        trade_count: row.trade_count ? Number(row.trade_count) : undefined,
        last_tx: row.last_tx ?? row.last_activity ?? undefined,
      }))
      .filter((row) => row.wallet) ?? [];
  return cache;
}

