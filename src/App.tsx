import React, { useEffect, useMemo, useState } from 'react';
import TerminalWrapper from '@components/TerminalWrapper';
import AsciiCat from '@components/AsciiCat';
import SearchBar from '@components/SearchBar';
import DashboardTable from '@components/DashboardTable';
import ChartComponent from '@components/ChartComponent';
import WalletConnectButton from '@components/WalletConnectButton';
import Alerts from '@components/Alerts';
import Portfolio from '@components/Portfolio';
import { defaultCatTokens } from '@lib/data';
import { findTrendingCatCoins } from '@lib/solana';
import type { TokenRow } from '@lib/types';

type ViewKey = 'home' | 'search' | 'portfolio' | 'alerts';

export default function App() {
  const [baseTokens, setBaseTokens] = useState<TokenRow[]>(defaultCatTokens);
  const [activeView, setActiveView] = useState<ViewKey>('home');
  const [query, setQuery] = useState<string>('');
  const tokens = useMemo(() => {
    if (!query.trim()) return baseTokens;
    const q = query.toLowerCase();
    return baseTokens.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [query, baseTokens]);

  // Load live trending cat tokens for the home dashboard (fallback to defaults on error).
  useEffect(() => {
    (async () => {
      try {
        const trending = await findTrendingCatCoins();
        if (trending && trending.length) {
          setBaseTokens(trending);
        }
      } catch {
        // ignore, keep defaults
      }
    })();
  }, []);

  return (
    <TerminalWrapper
      header="PawScan: [Home] [Search] [Portfolio] [Alerts]"
      onNav={(key) => setActiveView(key as ViewKey)}
      active={activeView}
    >
      {activeView === 'home' && (
        <>
          <AsciiCat />
          <div className="row gap">
            <WalletConnectButton />
          </div>
          <div className="section">
            <div className="banner">Clawing at Opportunities</div>
            <DashboardTable tokens={tokens} />
          </div>
          <div className="section">
            <ChartComponent symbol="MEW" />
          </div>
        </>
      )}
      {activeView === 'search' && (
        <>
          <SearchBar value={query} onChange={setQuery} />
          <DashboardTable tokens={tokens} />
        </>
      )}
      {activeView === 'portfolio' && <Portfolio />}
      {activeView === 'alerts' && <Alerts />}
    </TerminalWrapper>
  );
}


