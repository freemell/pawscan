"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { TerminalTitle } from "./terminal-title";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/kol-activity", label: "Smart Trader Activity" },
  { href: "/kol-tracker", label: "Smart Trader Tracker" },
];

export function TerminalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-6 md:px-0">
      <div className="ascii-card rounded bg-[rgba(0,0,0,0.85)] p-4 md:p-6">
        <TerminalTitle />
        <nav className="mb-4 mt-2 flex flex-wrap gap-3 text-lg text-[var(--terminal-accent)]">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-white ${active ? "text-white" : ""}`}
              >
                [{link.label}]
              </Link>
            );
          })}
        </nav>
        <div className="border border-[var(--terminal-accent)] p-3 md:p-4">
          {children}
        </div>
        <footer className="mt-4 text-center text-xs text-[var(--terminal-fg)]/60">
          Powered by{" "}
          <a
            href="https://moralis.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--terminal-accent)] hover:underline"
          >
            Moralis
          </a>
        </footer>
      </div>
    </div>
  );
}

