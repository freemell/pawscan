export function getEnv(key: string, fallback?: string) {
  const v = (import.meta as any).env?.[key];
  return (v ?? fallback) as string | undefined;
}

export const SOLANA_RPC = getEnv('VITE_SOLANA_RPC', 'https://api.mainnet-beta.solana.com')!;
export const BIRDEYE_API_KEY = getEnv('VITE_BIRDEYE_API_KEY');
export const BIRDEYE_BASE = getEnv('VITE_BIRDEYE_BASE', 'https://public-api.birdeye.so');
export const COINVERA_API_KEY = getEnv('VITE_COINVERA_API_KEY');
export const COINVERA_BASE = getEnv('VITE_COINVERA_BASE', 'https://api.coinvera.io');


