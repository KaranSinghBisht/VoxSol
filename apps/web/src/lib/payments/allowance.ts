import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

const STORAGE_KEY = 'voxsol_allowance_wallet';

export interface AllowanceWalletData {
  publicKey: string;
  encryptedSecret: string;
  iv: string;
}

export class AllowanceWallet {
  private keypair: Keypair | null = null;

  async create(pin: string): Promise<string> {
    const kp = Keypair.generate();
    this.keypair = kp;
    await this.save(pin);
    return kp.publicKey.toBase58();
  }

  async load(pin: string): Promise<boolean> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    try {
      const data = JSON.parse(stored) as AllowanceWalletData;
      const secretKey = await this.decrypt(data.encryptedSecret, data.iv, pin);
      this.keypair = Keypair.fromSecretKey(secretKey);
      return true;
    } catch (error) {
      console.error('Failed to load allowance wallet:', error);
      return false;
    }
  }

  async save(pin: string): Promise<void> {
    if (!this.keypair) return;

    const { encrypted, iv } = await this.encrypt(this.keypair.secretKey, pin);
    const data: AllowanceWalletData = {
      publicKey: this.keypair.publicKey.toBase58(),
      encryptedSecret: encrypted,
      iv,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  getPublicKey(): string | null {
    return this.keypair?.publicKey.toBase58() ?? null;
  }

  signMessage(message: Uint8Array): string {
    if (!this.keypair) throw new Error('Wallet not loaded');
    const signature = nacl.sign.detached(message, this.keypair.secretKey);
    return bs58.encode(signature);
  }

  private async encrypt(data: Uint8Array, pin: string): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const keyHash = await crypto.subtle.digest('SHA-256', pinData);
    const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, [
      'encrypt',
    ]);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as any);

    const encryptedArray = new Uint8Array(encrypted);
    let binary = '';
    for (let i = 0; i < encryptedArray.byteLength; i++) {
      binary += String.fromCharCode(encryptedArray[i]);
    }

    return {
      encrypted: btoa(binary),
      iv: btoa(String.fromCharCode(...Array.from(iv))),
    };
  }

  private async decrypt(
    encryptedBase64: string,
    ivBase64: string,
    pin: string
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const keyHash = await crypto.subtle.digest('SHA-256', pinData);
    const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);

    const encryptedStr = atob(encryptedBase64);
    const encrypted = new Uint8Array(encryptedStr.length);
    for (let i = 0; i < encryptedStr.length; i++) {
      encrypted[i] = encryptedStr.charCodeAt(i);
    }

    const ivStr = atob(ivBase64);
    const iv = new Uint8Array(ivStr.length);
    for (let i = 0; i < ivStr.length; i++) {
      iv[i] = ivStr.charCodeAt(i);
    }

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

    return new Uint8Array(decrypted);
  }
}
