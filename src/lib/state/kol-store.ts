"use client";

import { create } from "zustand";
import type { KolWallet, MoralisSwap, TradeAlert } from "@/lib/types";

type FilterOptions = {
  minProfit?: number;
  minWinRate?: number;
  activeOnly?: boolean;
};

type KolState = {
  wallets: KolWallet[];
  filtered: KolWallet[];
  watchlist: string[];
  alerts: TradeAlert[];
  swaps: Record<string, MoralisSwap[]>;
  lastSignature: Record<string, string>;
  filters: FilterOptions;
  setWallets: (items: KolWallet[]) => void;
  filterWallets: (query: string) => void;
  setFilters: (filters: FilterOptions) => void;
  addToWatchlist: (wallet: string) => void;
  pushAlert: (alert: TradeAlert) => void;
  cacheSwap: (wallet: string, swap: MoralisSwap) => void;
};

export const useKolStore = create<KolState>((set, get) => ({
  wallets: [],
  filtered: [],
  watchlist: [],
  alerts: [],
  swaps: {},
  lastSignature: {},
  filters: {},
  setWallets: (items) =>
    set({
      wallets: items,
      filtered: items,
    }),
  filterWallets: (query) =>
    set((state) => {
      const q = query.toLowerCase().trim();
      let filtered = state.wallets;

      // Apply text search
      if (q) {
        filtered = filtered.filter(
          (wallet) =>
            wallet.wallet.toLowerCase().includes(q) ||
            wallet.rank.toString() === q,
        );
      }

      // Apply advanced filters
      const { minProfit, minWinRate, activeOnly } = state.filters;
      if (minProfit && minProfit > 0) {
        filtered = filtered.filter((w) => w.realized_profit >= minProfit);
      }
      if (minWinRate && minWinRate > 0) {
        filtered = filtered.filter((w) => (w.win_rate ?? 0) >= minWinRate);
      }
      if (activeOnly) {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        filtered = filtered.filter((w) => {
          if (!w.last_tx) return false;
          const txTime = new Date(w.last_tx).getTime();
          return !Number.isNaN(txTime) && txTime > dayAgo;
        });
      }

      return { filtered };
    }),
  setFilters: (filters) =>
    set((state) => {
      // Just update filters - filterWallets will be called separately
      return { filters };
    }),
  addToWatchlist: (wallet) =>
    set((state) => {
      if (state.watchlist.includes(wallet)) return state;
      return { watchlist: [...state.watchlist, wallet] };
    }),
  pushAlert: (alert) =>
    set((state) => {
      if (state.lastSignature[alert.wallet] === alert.id) {
        return state;
      }
      const alerts = [alert, ...state.alerts].slice(0, 100);
      return {
        alerts,
        lastSignature: {
          ...state.lastSignature,
          [alert.wallet]: alert.id,
        },
      };
    }),
  cacheSwap: (wallet, swap) =>
    set((state) => {
      const existing = state.swaps[wallet] ?? [];
      if (existing.find((s) => s.signature === swap.signature)) {
        return state;
      }
      return {
        swaps: {
          ...state.swaps,
          [wallet]: [swap, ...existing].slice(0, 50),
        },
        lastSignature: {
          ...state.lastSignature,
          [wallet]: swap.signature,
        },
      };
    }),
}));

