import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getWalletHoldings } from '@lib/solana';
import { formatAsciiTable } from '@lib/table';

export default function Portfolio() {
  const { publicKey, connected } = useWallet();
  const [rows, setRows] = useState<{ Token: string; Balance: string; Value: string }[]>([]);

  useEffect(() => {
    (async () => {
      if (!connected || !publicKey) {
        setRows([]);
        return;
      }
      const holdings = await getWalletHoldings(publicKey.toBase58());
      setRows(
        holdings.map((h) => ({
          Token: h.symbol,
          Balance: h.balance.toFixed(4),
          Value: `$${(h.usdValue ?? 0).toFixed(2)}`
        }))
      );
    })();
  }, [connected, publicKey]);

  const table = formatAsciiTable(['Token', 'Balance', 'Value'], rows);
  return (
    <div className="section">
      <div className="banner">Purring Portfolios</div>
      {connected ? <pre className="table">{table}</pre> : <div className="ascii-box">[ Connect Wallet ] to view portfolio.</div>}
    </div>
  );
}


