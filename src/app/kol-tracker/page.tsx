import { TerminalShell } from "@/components/terminal-shell";
import { KolTrackerClient } from "@/components/tracker/kol-tracker-client";

export default function KolTrackerPage() {
  return (
    <TerminalShell>
      <KolTrackerClient />
    </TerminalShell>
  );
}

