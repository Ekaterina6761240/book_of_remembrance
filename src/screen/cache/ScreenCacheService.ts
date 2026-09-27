import type { ScreenContentSnapshot } from '../../repositories';
import {
  APP_CACHE_PREFIX,
  CACHE_STALE_AFTER_MS,
  SCREEN_CACHE_ACTIVE_KEY,
  SCREEN_CACHE_DB_NAME,
  SCREEN_CACHE_DB_VERSION,
  SCREEN_CACHE_STORE_NAME,
  SCREEN_MEDIA_CACHE_NAME,
} from './constants';

export type CachedScreenContent = {
  version: number;
  timestamp: number;
  data: ScreenContentSnapshot;
};

export type ScreenContentCache = {
  read(): Promise<CachedScreenContent | null>;
  save(snapshot: CachedScreenContent): Promise<void>;
  cacheMedia(snapshot: ScreenContentSnapshot): Promise<void>;
  clear(): Promise<void>;
};

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed')), { once: true });
  });

const transactionComplete = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('IndexedDB transaction aborted')), { once: true });
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('IndexedDB transaction failed')), { once: true });
  });

const openDatabase = (factory: IDBFactory): Promise<IDBDatabase> => {
  const request = factory.open(SCREEN_CACHE_DB_NAME, SCREEN_CACHE_DB_VERSION);
  request.addEventListener('upgradeneeded', () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(SCREEN_CACHE_STORE_NAME)) {
      database.createObjectStore(SCREEN_CACHE_STORE_NAME);
    }
  });
  return requestResult(request);
};

const deleteDatabase = (factory: IDBFactory): Promise<void> => {
  const request = factory.deleteDatabase(SCREEN_CACHE_DB_NAME);
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(), { once: true });
    request.addEventListener('blocked', () => reject(new Error('IndexedDB cache deletion was blocked')), { once: true });
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB cache deletion failed')), { once: true });
  });
};

export const isCachedScreenContentStale = (
  cached: CachedScreenContent,
  now = Date.now(),
): boolean => now - cached.timestamp > CACHE_STALE_AFTER_MS;

export const getScreenMediaUrls = (snapshot: ScreenContentSnapshot): string[] => {
  const urls = new Set<string>();
  snapshot.heroes.forEach((hero) => {
    [hero.mainImage, ...hero.gallery].forEach((media) => {
      if (!media) return;
      urls.add(media.url);
      if (media.thumbnailUrl) urls.add(media.thumbnailUrl);
    });
  });
  return [...urls];
};

export class ScreenCacheService implements ScreenContentCache {
  constructor(
    private readonly databaseFactory: IDBFactory = window.indexedDB,
    private readonly cacheStorage: CacheStorage = window.caches,
  ) {}

  async read(): Promise<CachedScreenContent | null> {
    const database = await openDatabase(this.databaseFactory);
    try {
      const transaction = database.transaction(SCREEN_CACHE_STORE_NAME, 'readonly');
      const completed = transactionComplete(transaction);
      const request = transaction.objectStore(SCREEN_CACHE_STORE_NAME).get(SCREEN_CACHE_ACTIVE_KEY);
      const cached = await requestResult<CachedScreenContent | undefined>(request);
      await completed;
      return cached ?? null;
    } finally {
      database.close();
    }
  }

  async save(snapshot: CachedScreenContent): Promise<void> {
    const database = await openDatabase(this.databaseFactory);
    try {
      const transaction = database.transaction(SCREEN_CACHE_STORE_NAME, 'readwrite');
      transaction.objectStore(SCREEN_CACHE_STORE_NAME).put(snapshot, SCREEN_CACHE_ACTIVE_KEY);
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  }

  async cacheMedia(snapshot: ScreenContentSnapshot): Promise<void> {
    const cache = await this.cacheStorage.open(SCREEN_MEDIA_CACHE_NAME);
    await Promise.allSettled(getScreenMediaUrls(snapshot).map(async (url) => {
      const cached = await cache.match(url, { ignoreVary: true });
      if (!cached) await cache.add(url);
    }));
  }

  async clear(): Promise<void> {
    await deleteDatabase(this.databaseFactory);
    const cacheNames = await this.cacheStorage.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX))
        .map((cacheName) => this.cacheStorage.delete(cacheName)),
    );
  }
}
