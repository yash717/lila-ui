import { Client } from '@heroiclabs/nakama-js';
import { randomUUID } from '../lib/randomUUID';

const host = import.meta.env.VITE_NAKAMA_HOST ?? '127.0.0.1';
const port = import.meta.env.VITE_NAKAMA_PORT ?? '7350';
const serverKey = import.meta.env.VITE_NAKAMA_SERVER_KEY ?? 'nebula-strike-dev-key';
const useSSL = import.meta.env.VITE_NAKAMA_USE_SSL === 'true';

export const nakamaConfig = { host, port, serverKey, useSSL };

export function createNakamaClient(): Client {
  return new Client(serverKey, host, port, useSSL);
}

const DEVICE_KEY = 'nebula_strike_device_id';

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `guest-${Math.random().toString(36).slice(2)}`;
  }
}

export function avatarUrlForSeed(seed: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
}
