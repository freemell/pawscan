import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { KolPollingBridge } from "@/components/providers/kol-polling";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "PawScan — Smart Trader Terminal",
  description:
    "Track Solana smart-trader wallets, meme trades, and portfolio in Pawfect style.",
  icons: {
    icon: "/cat.svg",
    shortcut: "/cat.svg",
    apple: "/cat.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vt323.variable} bg-[var(--terminal-bg)] text-[var(--terminal-fg)]`}>
        <ReactQueryProvider>
          <KolPollingBridge />
          <div className="relative min-h-screen bg-black/95">
            {children}
            <div className="scanline-overlay" />
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
