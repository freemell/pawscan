import { TerminalShell } from "@/components/terminal-shell";
import { KolActivityFeed } from "@/components/kol-activity-feed";
import { TopGainersPanel } from "@/components/top-gainers";

export default function KolActivityPage() {
  return (
    <TerminalShell>
      <div className="space-y-4">
        <h1 className="text-2xl text-[var(--terminal-accent)]">Live Smart Trader Activity</h1>
        <KolActivityFeed />
        <TopGainersPanel />
      </div>
    </TerminalShell>
  );
}

