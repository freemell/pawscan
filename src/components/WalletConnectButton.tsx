import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnectButton() {
  return (
    <div className="btn">
      <WalletMultiButton />
    </div>
  );
}


