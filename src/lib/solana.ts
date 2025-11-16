import { Connection, PublicKey } from '@solana/web3.js';
import type { Holding, TokenRow } from './types';
import { defaultCatTokens, symbolToMint } from './data';
import { BIRDEYE_API_KEY, BIRDEYE_BASE, SOLANA_RPC, COINVERA_API_KEY, COINVERA_BASE } from './config';

const connection = new Connection(SOLANA_RPC, 'confirmed');

// Simple in-memory cache to respect free-tier rate limits (60 rpm).
let trendingCache: Array<TokenRow & { buzz: number }> | null = null;
let trendingCacheTimestamp = 0;
const TRENDING_TTL_MS = 30_000; // 30 seconds

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function getWalletHoldings(address: string): Promise<Holding[]> {
  try {
    const pub = new PublicKey(address);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pub, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
    // Minimal parse: only display balances for default tokens as demo; real impl would map mint to metadata & price feed
    const holdings: Holding[] = [];
    for (const acc of tokenAccounts.value) {
      const info: any = acc.account.data.parsed.info;
      const mint: string = info.mint;
      const amountUi = Number(info.tokenAmount.uiAmount);
      const meta = defaultCatTokens.find((t) => t.mint === mint);
      if (meta && amountUi > 0) {
        holdings.push({
          mint,
          symbol: meta.symbol,
          balance: amountUi,
          usdValue: meta.priceUsd ? amountUi * meta.priceUsd : undefined
        });
      }
    }
    return holdings;
  } catch {
    return [];
  }
}

export async function getHistoricalPriceSeries(symbol: string): Promise<{ priceSeries: number[]; volumeSeries: number[] }> {
  const mint = symbolToMint[symbol];
  if (BIRDEYE_API_KEY && mint) {
    try {
      // Birdeye price history (example endpoint)
      // Docs: public-api.birdeye.so - token price history
      const hours = 240;
      const interval = '1h';
      const url = `${BIRDEYE_BASE}/defi/history/price?address=${mint}&type=${interval}&time_from=${Math.floor(
        Date.now() / 1000 - hours * 3600
      )}&time_to=${Math.floor(Date.now() / 1000)}`;
      const data = await fetchJson<{ data?: { items?: Array<{ value: number; unixTime: number }> } }>(url, {
        accept: 'application/json',
        'X-API-KEY': BIRDEYE_API_KEY
      });
      const items = data?.data?.items ?? [];
      const priceSeries = items.map((i) => Number(i.value)).filter((n) => Number.isFinite(n));

      // Volume history (normalized fallback if not available)
      const volumeSeries = priceSeries.map(() => Math.random() * 1_000_000);
      if (priceSeries.length > 0) {
        return { priceSeries, volumeSeries };
      }
    } catch {
      // fall through to synthetic
    }
  }
  // Synthetic fallback when no API key or mapping:
  const base = Math.random() * 0.02 + 0.001;
  const priceSeries: number[] = [];
  const volumeSeries: number[] = [];
  let p = base;
  for (let i = 0; i < 240; i++) {
    const drift = (Math.random() - 0.5) * base * 0.1;
    p = Math.max(0.0000001, p + drift);
    priceSeries.push(p);
    volumeSeries.push(Math.random() * 1_000_000);
  }
  return { priceSeries, volumeSeries };
}

export async function findTrendingCatCoins(): Promise<Array<TokenRow & { buzz: number }>> {
  const now = Date.now();
  if (trendingCache && now - trendingCacheTimestamp < TRENDING_TTL_MS) {
    return trendingCache;
  }
  // 1) Try Birdeye "top tokens" style endpoint (browser friendly).
  if (BIRDEYE_API_KEY) {
    try {
      // Birdeye tokenlist example from docs (Solana):
      // /defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=100&ui_amount_mode=scaled
      const url = `${BIRDEYE_BASE}/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=100&ui_amount_mode=scaled`;
      const data = await fetchJson<{
        data?: {
          updateUnixTime?: number;
          updateTime?: string;
          tokens?: Array<{
            address: string;
            symbol: string;
            name: string;
            mc?: number;
            liquidity?: number;
            v24hUSD?: number;
            price?: number;
          }>;
        };
      }>(url, {
        accept: 'application/json',
        'X-API-KEY': BIRDEYE_API_KEY,
        'x-chain': 'solana'
      });

      const items = data.data?.tokens ?? [];
      if (items.length) {
        const mapped = items.slice(0, 50).map((t, idx) => ({
          mint: t.address,
          symbol: t.symbol,
          name: t.name,
          priceUsd: t.price,
          volume24h: t.v24hUSD,
          liquidityUsd: t.liquidity ?? t.mc,
          holderCount: undefined,
          topHolderPct: undefined,
          devWalletActivity: undefined,
          buzz: 100 - idx
        }));
        trendingCache = mapped;
        trendingCacheTimestamp = now;
        return mapped;
      }
    } catch {
      // fall through
    }
  }

  // 2) Fallback: CoinVera "trending Solana tokens" style endpoint if configured.
  if (COINVERA_API_KEY) {
    try {
      // Example CoinVera docs: GET /v1/solana/tokens/trending
      const url = `${COINVERA_BASE}/v1/solana/tokens/trending`;
      const data = await fetchJson<{
        data?: Array<{
          address: string;
          symbol: string;
          name: string;
          marketCapUsd?: number;
          volume24hUsd?: number;
          liquidityUsd?: number;
          priceUsd?: number;
        }>;
      }>(url, {
        accept: 'application/json',
        'X-API-KEY': COINVERA_API_KEY
      });

      const items = data.data ?? [];
      // Sort by market cap (fallback: liquidity, then volume) so rank represents size
      items.sort((a, b) => {
        const ma = a.marketCapUsd ?? a.liquidityUsd ?? a.volume24hUsd ?? 0;
        const mb = b.marketCapUsd ?? b.liquidityUsd ?? b.volume24hUsd ?? 0;
        return mb - ma;
      });
      if (items.length) {
        return items.slice(0, 10).map((t, idx) => ({
          mint: t.address,
          symbol: t.symbol,
          name: t.name,
          priceUsd: t.priceUsd,
          volume24h: t.volume24hUsd,
          liquidityUsd: t.liquidityUsd ?? t.marketCapUsd,
          holderCount: undefined,
          topHolderPct: undefined,
          devWalletActivity: undefined,
          buzz: 100 - idx * 5
        }));
      }
    } catch {
      // fall through
    }
  }

  // 3) If Birdeye is available and we have mints, fetch current prices/volumes for default cats.
  if (BIRDEYE_API_KEY) {
    try {
      const enriched: Array<TokenRow & { buzz: number }> = [];
      for (const t of defaultCatTokens) {
        const mint = symbolToMint[t.symbol];
        if (!mint) continue;
        const priceUrl = `${BIRDEYE_BASE}/defi/price?address=${mint}`;
        const priceResp = await fetchJson<{ data?: { value?: number } }>(priceUrl, {
          accept: 'application/json',
          'X-API-KEY': BIRDEYE_API_KEY
        });
        const priceUsd = priceResp?.data?.value ?? t.priceUsd ?? 0;
        enriched.push({ ...t, priceUsd, buzz: Math.floor(50 + Math.random() * 50) });
      }
      const ranked = enriched.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
      return ranked.slice(0, 3);
    } catch {
      // fallback below
    }
  }
  // Fallback: rank by known 24h volume
  const ranked = [...defaultCatTokens].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  return ranked.slice(0, 3).map((t, i) => ({ ...t, buzz: 100 - i * 7 }));
}


