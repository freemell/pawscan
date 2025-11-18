import { TerminalShell } from "@/components/terminal-shell";
import { WalletIntelClient } from "@/components/wallet/wallet-intel-client";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ address: string }>;
};

export default async function WalletPage({ params }: Props) {
  const { address } = await params;
  if (!address) return notFound();
  return (
    <TerminalShell>
      <WalletIntelClient address={address} />
    </TerminalShell>
  );
}

