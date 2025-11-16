import React from 'react';

type Props = {
  header: string;
  active: string;
  onNav: (key: string) => void;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'search', label: 'Search' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'alerts', label: 'Alerts' }
];

export default function TerminalWrapper({ header, active, onNav, children }: Props) {
  return (
    <div className="terminal scanlines">
      <div className="ascii-border">
{`╔══════════════════════════════════════════════════════════════╗`}
      </div>
      <div className="header">{header}</div>
      <div className="nav">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            className={active === item.key ? 'active' : undefined}
            onClick={() => onNav(item.key)}
            href="#"
          >
            [{item.label}]
          </a>
        ))}
      </div>
      <div>{children}</div>
      <div className="ascii-border">
{`╚══════════════════════════════════════════════════════════════╝`}
      </div>
    </div>
  );
}


