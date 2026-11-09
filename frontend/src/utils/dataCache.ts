/**
 * Learnflow In-Memory Stale-While-Revalidate Data Cache
 * Eliminates visual loading delays when switching between tabs & routes.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export const dataCache = {
  get<T>(key: string, maxAgeMs = 120000): T | null {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      // Data is stale but can be used for instant rendering while revalidating
      return entry.data;
    }
    return entry.data;
  },

  set<T>(key: string, data: T): void {
    memoryCache.set(key, { data, timestamp: Date.now() });
  },

  clear(key?: string): void {
    if (key) {
      memoryCache.delete(key);
    } else {
      memoryCache.clear();
    }
  },
};

export default dataCache;
