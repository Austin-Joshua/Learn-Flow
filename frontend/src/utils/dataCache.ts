/**
 * Learnflow Two-Tier (Memory + Session) Stale-While-Revalidate Data Cache
 * Eliminates visual loading stalls during page switches and browser reloads.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

const SESSION_PREFIX = 'learnflow_cache_';

export const dataCache = {
  get<T>(key: string, maxAgeMs = 180000): T | null {
    // 1. Check in-memory Map (0ms latency)
    const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      return memEntry.data;
    }

    // 2. Check sessionStorage tier (survives page reloads / F5)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = window.sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry<T>;
          if (parsed && parsed.data !== undefined) {
            // Re-hydrate memory cache
            memoryCache.set(key, parsed);
            return parsed.data;
          }
        }
      } catch {
        // Ignore session storage parse error
      }
    }

    return null;
  },

  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`${SESSION_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // Quota exceeded or private browsing restriction - memory tier still succeeds
      }
    }
  },

  clear(key?: string): void {
    if (key) {
      memoryCache.delete(key);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          window.sessionStorage.removeItem(`${SESSION_PREFIX}${key}`);
        } catch {
          // Ignore
        }
      }
    } else {
      memoryCache.clear();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            if (k && k.startsWith(SESSION_PREFIX)) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
        } catch {
          // Ignore
        }
      }
    }
  },
};

export default dataCache;
