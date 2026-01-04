'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Vox4Hta7Tank473DCBwbEdYUBqFBWxfntK3WwkdGf3L');

export function useVault() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    const idl: any = {
      address: PROGRAM_ID.toBase58(),
      metadata: { name: 'vault', version: '0.1.0', spec: '0.1.0' },
      instructions: [
        {
          name: 'initializeVault',
          discriminator: [65, 39, 227, 78, 227, 222, 90, 200],
          accounts: [
            { name: 'vaultState', writable: true, signer: false },
            { name: 'admin', writable: true, signer: true },
            { name: 'systemProgram', writable: false, signer: false },
          ],
          args: [{ name: 'apyBps', type: 'u64' }],
        },
        {
          name: 'deposit',
          discriminator: [242, 35, 198, 137, 82, 225, 242, 182],
          accounts: [
            { name: 'vaultState', writable: true, signer: false },
            { name: 'vaultPda', writable: true, signer: false },
            { name: 'position', writable: true, signer: false },
            { name: 'user', writable: true, signer: true },
            { name: 'systemProgram', writable: false, signer: false },
          ],
          args: [{ name: 'amount', type: 'u64' }],
        },
        {
          name: 'withdraw',
          discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
          accounts: [
            { name: 'vaultState', writable: true, signer: false },
            { name: 'vaultPda', writable: true, signer: false },
            { name: 'position', writable: true, signer: false },
            { name: 'owner', writable: false, signer: true },
            { name: 'user', writable: true, signer: false },
            { name: 'systemProgram', writable: false, signer: false },
          ],
          args: [{ name: 'amount', type: 'u64' }],
        },
      ],
      accounts: [
        {
          name: 'VaultState',
          discriminator: [228, 196, 82, 165, 98, 210, 235, 152],
        },
        {
          name: 'Position',
          discriminator: [170, 188, 143, 228, 122, 64, 247, 208],
        },
      ],
      types: [
        {
          name: 'VaultState',
          type: {
            kind: 'struct',
            fields: [
              { name: 'admin', type: 'pubkey' },
              { name: 'apyBps', type: 'u64' },
              { name: 'totalDeposited', type: 'u64' },
              { name: 'bump', type: 'u8' },
            ],
          },
        },
        {
          name: 'Position',
          type: {
            kind: 'struct',
            fields: [
              { name: 'owner', type: 'pubkey' },
              { name: 'amount', type: 'u64' },
              { name: 'startTime', type: 'i64' },
              { name: 'accruedYield', type: 'u64' },
            ],
          },
        },
      ],
    };
    return new Program(idl, provider);
  }, [provider]);

  const [vaultStatePda] = useMemo(
    () => PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID),
    []
  );

  const [vaultPda] = useMemo(
    () => PublicKey.findProgramAddressSync([Buffer.from('vault_pda')], PROGRAM_ID),
    []
  );

  const getPositionPda = useCallback((owner: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('position'), owner.toBuffer()],
      PROGRAM_ID
    )[0];
  }, []);

  const [vaultState, setVaultState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchVaultState = useCallback(async () => {
    if (!program) return;
    try {
      const state = await (program.account as any).vaultState.fetch(vaultStatePda);
      setVaultState(state);
    } catch (err) {
      console.error('Failed to fetch vault state:', err);
    }
  }, [program, vaultStatePda]);

  useEffect(() => {
    fetchVaultState();
  }, [fetchVaultState]);

  const deposit = useCallback(
    async (amount: number) => {
      if (!program || !wallet) throw new Error('Not connected');
      setLoading(true);
      try {
        const positionPda = getPositionPda(wallet.publicKey);

        const tx = await program.methods
          .deposit(new BN(amount))
          .accounts({
            vaultState: vaultStatePda,
            vaultPda,
            position: positionPda,
            user: wallet.publicKey,
            systemProgram: PublicKey.default,
          } as any)
          .rpc();
        await fetchVaultState();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getPositionPda, vaultStatePda, vaultPda, fetchVaultState]
  );

  const withdraw = useCallback(
    async (amount: number) => {
      if (!program || !wallet) throw new Error('Not connected');
      setLoading(true);
      try {
        const positionPda = getPositionPda(wallet.publicKey);

        const tx = await program.methods
          .withdraw(new BN(amount))
          .accounts({
            vaultState: vaultStatePda,
            vaultPda,
            position: positionPda,
            owner: wallet.publicKey,
            user: wallet.publicKey,
            systemProgram: PublicKey.default,
          } as any)
          .rpc();
        await fetchVaultState();
        return tx;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet, getPositionPda, vaultStatePda, vaultPda, fetchVaultState]
  );

  const getPosition = useCallback(async () => {
    if (!program || !wallet) return null;
    try {
      const positionPda = getPositionPda(wallet.publicKey);
      return await (program.account as any).position.fetch(positionPda);
    } catch {
      return null;
    }
  }, [program, wallet, getPositionPda]);

  return {
    vaultState,
    loading,
    deposit,
    withdraw,
    getPosition,
    vaultStatePda,
    vaultPda,
    refresh: fetchVaultState,
  };
}
