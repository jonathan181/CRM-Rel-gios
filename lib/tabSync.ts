'use client';

import { Watch } from '@/types/watch';

type SyncMessage =
  | { type: 'WATCH_SAVED'; watch: Watch; allWatches?: Watch[] }
  | { type: 'WATCH_DELETED'; watchId: string; allWatches?: Watch[] }
  | { type: 'WATCHES_SYNCED'; allWatches: Watch[] }
  | { type: 'FORCE_REFRESH' };

const CHANNEL_NAME = 'horological_precision_cross_tab_sync';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;

  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed to create:', e);
      channel = null;
    }
  }
  return channel;
}

export function broadcastWatchSaved(watch: Watch, allWatches?: Watch[]) {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'WATCH_SAVED', watch, allWatches } as SyncMessage);
    } catch (e) {
      console.warn('Error broadcasting watch saved:', e);
    }
  }
}

export function broadcastWatchDeleted(watchId: string, allWatches?: Watch[]) {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'WATCH_DELETED', watchId, allWatches } as SyncMessage);
    } catch (e) {
      console.warn('Error broadcasting watch deleted:', e);
    }
  }
}

export function broadcastWatchesSynced(allWatches: Watch[]) {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'WATCHES_SYNCED', allWatches } as SyncMessage);
    } catch (e) {
      console.warn('Error broadcasting watches synced:', e);
    }
  }
}

export function subscribeToCrossTabSync(onMessage: (msg: SyncMessage) => void): () => void {
  const ch = getChannel();
  if (!ch) {
    // Fallback: storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'horological_precision_watches_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            onMessage({ type: 'WATCHES_SYNCED', allWatches: parsed });
          }
        } catch (err) {
          // ignore
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
    return () => {};
  }

  const handler = (event: MessageEvent<SyncMessage>) => {
    if (event.data) {
      onMessage(event.data);
    }
  };

  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
  };
}
