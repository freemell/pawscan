import { TerminalShell } from "@/components/terminal-shell";
import { AsciiCat } from "@/components/ascii-cat";
import Link from "next/link";

export default function Home() {
  return (
    <TerminalShell>
      <AsciiCat />
      <p className="mb-4 text-xl">
        Welcome to <span className="text-[var(--terminal-accent)]">PawScan</span>, the purrr
        Solana terminal for stalking pretty smart traders and meme coin whisperers. Strap into the CRT cockpit, let the paw
       guide you, and orchestrate copy trade intel without leaving the retro grid. you can also search up your wallet to know your rank among traders in solana
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="ascii-card border border-[var(--terminal-accent)] p-3">
          <h2 className="text-[var(--terminal-accent)]">Paw Ops Checklist</h2>
          <ul className="list-inside list-disc space-y-2 text-base">
            <li>
              Prowl{" "}
              <Link href="/kol-tracker" className="text-[var(--terminal-warn)]">
                [Smart Trader Tracker]
              </Link>{" "}
              to parse the 10,000 wallet dossier from the solana den in real time.
            </li>
            <li>Scratch into any wallet link to open the intel dashboard loaded with charts.</li>
            <li>Hit <code>Monitor</code> to beam that wallet into the live paw activity ticker. you get? "pawactivity"</li>
          </ul>
        </section>
        <section className="ascii-card border border-[var(--terminal-accent)] p-3">
          <h2 className="text-[var(--terminal-accent)]">Current Signal</h2>
          <p className="text-base">
            Swaps uplink polls every 30 seconds, portfolios refresh on demand, and copy-trade hints
            pulse through the neon borders. All heavy lifting stays in the backend vault – visitors
            only see the glam glow.
          </p>
          <p className="text-base text-[var(--terminal-warn)]">
            Keep an eye on the activity feed for fresh meme buys; paw badges flare whenever a low-cap
            token sneaks into the stack.
          </p>
        </section>
      </div>
    </TerminalShell>
  );
}
