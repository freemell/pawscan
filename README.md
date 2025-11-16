# PawScan — Cat-Themed Meme Coin Tracker (Solana)

PawScan is a terminal-styled, ASCII-themed dApp for discovering, tracking, and analyzing Solana meme coins with a special focus on cat coins (MEW, Popcat, Michi, etc.).

## Tech
- React + Vite + TypeScript
- Solana: `@solana/web3.js` and wallet adapters
- Raydium SDK (placeholder hooks for liquidity data)
- ASCII UI + charts using CSS and `asciichart`

## Features
- ASCII terminal UI, cat ASCII art with loading animation
- Search by token name/symbol
- ASCII tables for token lists with risk score
- ASCII charts (plus hidden canvas fallback)
- Wallet connect (Phantom, Solflare)
- Portfolio view for connected wallet
- Alerts for trending cat coins (desktop notifications optional)

## Getting Started

```bash
npm install
npm run dev
```

Create `.env` (optional) to override RPC endpoint:

```
VITE_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Deploy
- Vercel or Netlify: build command `npm run build`, output `dist/`.

## Notes
- Some data (prices/volume/liquidity) is mocked for demo. Replace functions in `src/lib/solana.ts` with calls to Birdeye/Helius/QuickNode and Raydium SDK.
- The UI uses a cat paw cursor via a data URL. Replace in `src/styles/terminal.css` if desired.


