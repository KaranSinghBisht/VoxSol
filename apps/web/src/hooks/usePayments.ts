'use client';

import { useState, useCallback, useEffect } from 'react';
import { AllowanceWallet } from '@/lib/payments/allowance';
import { X402_HEADERS, type PaymentRequirements, type PaymentProof } from '@voxsol/shared';

export function usePayments() {
  const [wallet] = useState(() => new AllowanceWallet());
  const [isLoaded, setIsLoaded] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const initWallet = useCallback(
    async (pin: string) => {
      const loaded = await wallet.load(pin);
      if (!loaded) {
        await wallet.create(pin);
      }
      setIsLoaded(true);
      setPublicKey(wallet.getPublicKey());
    },
    [wallet]
  );

  const signPayment = useCallback(
    async (requirements: PaymentRequirements): Promise<string> => {
      if (!isLoaded) throw new Error('Allowance wallet not initialized');

      const payload = JSON.stringify({
        paymentId: requirements.paymentId,
        amount: requirements.amount,
        tokenMint: requirements.tokenMint,
        timestamp: Date.now(),
      });

      const encoder = new TextEncoder();
      const signature = wallet.signMessage(encoder.encode(payload));

      const proof: PaymentProof = {
        paymentId: requirements.paymentId,
        signature,
        payer: wallet.getPublicKey()!,
      };

      return JSON.stringify(proof);
    },
    [wallet, isLoaded]
  );

  return {
    isLoaded,
    publicKey,
    initWallet,
    signPayment,
  };
}
