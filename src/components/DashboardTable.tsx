import React, { useMemo } from 'react';
import { computeRiskScore } from '@lib/risk';
import { formatAsciiTable } from '@lib/table';
import type { TokenRow } from '@lib/types';

type Props = {
  tokens: TokenRow[];
};

export default function DashboardTable({ tokens }: Props) {
  const rows = useMemo(() => {
    return tokens.map((t) => {
      const risk = computeRiskScore(t);
      return {
        Symbol: t.symbol,
        Price: t.priceUsd ? t.priceUsd.toFixed(6) : '-',
        Volume: t.volume24h ? `${(t.volume24h / 1_000_000).toFixed(2)}M` : '-',
        Risk: risk.label
      };
    });
  }, [tokens]);

  const table = useMemo(() => {
    return formatAsciiTable(['Symbol', 'Price', 'Volume', 'Risk'], rows);
  }, [rows]);

  return <pre className="table">{table}</pre>;
}


