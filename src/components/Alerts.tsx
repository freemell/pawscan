import React, { useEffect, useState } from 'react';
import { findTrendingCatCoins } from '@lib/solana';
import { formatAsciiTable } from '@lib/table';
import { computeRiskScore } from '@lib/risk';

export default function Alerts() {
  const [rows, setRows] = useState<{ Rank: string; Symbol: string; Mcap: string; Volume: string; Risk: string }[]>([]);

  useEffect(() => {
    (async () => {
      const items = await findTrendingCatCoins();
      setRows(
        items.map((i, idx) => {
          const risk = computeRiskScore(i);
          const mcap = (i.liquidityUsd ?? i.priceUsd ?? 0) || 0;
          return {
            Rank: String(idx + 1).padStart(2, ' '),
            Symbol: i.symbol,
            Mcap: mcap ? `$${(mcap / 1_000_000).toFixed(2)}M` : '-',
            Volume: i.volume24h ? `${(i.volume24h / 1_000_000).toFixed(2)}M` : '-',
            Risk: risk.label
          };
        })
      );
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('PawScan', { body: 'Hot cat coins detected! 🐾' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    })();
  }, []);

  const table =
    rows.length > 0
      ? formatAsciiTable(['Rank', 'Symbol', 'Mcap', 'Volume', 'Risk'], rows)
      : 'No live trending data yet. Keeping paws on-chain...';
  return (
    <div className="section">
      <div className="banner">Catnip Rewards: Hot Cat Coins</div>
      <pre className="table">{table}</pre>
      <div className="ascii-box warn">Connect wallets safely; never share private keys.</div>
    </div>
  );
}


