import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { ScreenContentSnapshot } from '../../../src/repositories';
import {
  APP_CACHE_PREFIX,
  CACHE_STALE_AFTER_MS,
  ScreenCacheService,
  getScreenMediaUrls,
  isCachedScreenContentStale,
} from '../../../src/screen/cache';

class MemoryCacheStorage {
  readonly names = new Set<string>();
  readonly addedUrls: string[] = [];
  readonly cachedUrls = new Set<string>();

  async open(name: string): Promise<Cache> {
    this.names.add(name);
    return {
      match: async (url: RequestInfo | URL) => this.cachedUrls.has(String(url)) ? new Response() : undefined,
      add: async (url: RequestInfo | URL) => {
        this.addedUrls.push(String(url));
        this.cachedUrls.add(String(url));
      },
    } as Cache;
  }

  async keys(): Promise<string[]> {
    return [...this.names];
  }

  async delete(name: string): Promise<boolean> {
    return this.names.delete(name);
  }
}

const content: ScreenContentSnapshot = {
  version: 5,
  districts: [{ id: 1, name: 'Район', slug: 'district' }],
  heroes: [{
    id: 1,
    firstName: 'Иван',
    lastName: 'Панфилов',
    districtId: 1,
    mainImage: { id: 1, url: '/media/screen/hero.webp', thumbnailUrl: '/media/screen/hero-card.webp' },
    gallery: [{ id: 2, url: '/media/screen/document.webp' }],
  }],
};

describe('ScreenCacheService', () => {
  it('stores the complete active snapshot as one IndexedDB value', async () => {
    const cacheStorage = new MemoryCacheStorage();
    const service = new ScreenCacheService(new IDBFactory(), cacheStorage as unknown as CacheStorage);
    const cached = { version: 5, timestamp: 123, data: content };

    await service.save(cached);

    await expect(service.read()).resolves.toEqual(cached);
  });

  it('pre-caches full and thumbnail media URLs supplied by the public screen snapshot', async () => {
    const cacheStorage = new MemoryCacheStorage();
    const service = new ScreenCacheService(new IDBFactory(), cacheStorage as unknown as CacheStorage);

    await service.cacheMedia(content);

    expect(cacheStorage.addedUrls).toEqual(getScreenMediaUrls(content));
    expect(cacheStorage.addedUrls).toEqual([
      '/media/screen/hero.webp',
      '/media/screen/hero-card.webp',
      '/media/screen/document.webp',
    ]);
  });

  it('does not download media that is already cached', async () => {
    const cacheStorage = new MemoryCacheStorage();
    cacheStorage.cachedUrls.add('/media/screen/hero.webp');
    const service = new ScreenCacheService(new IDBFactory(), cacheStorage as unknown as CacheStorage);

    await service.cacheMedia(content);

    expect(cacheStorage.addedUrls).not.toContain('/media/screen/hero.webp');
    expect(cacheStorage.addedUrls).toEqual([
      '/media/screen/hero-card.webp',
      '/media/screen/document.webp',
    ]);
  });

  it('clears only application-owned Cache Storage entries', async () => {
    const cacheStorage = new MemoryCacheStorage();
    cacheStorage.names.add(`${APP_CACHE_PREFIX}shell-build`);
    cacheStorage.names.add(`${APP_CACHE_PREFIX}screen-media-v1`);
    cacheStorage.names.add('another-wordpress-plugin');
    const service = new ScreenCacheService(new IDBFactory(), cacheStorage as unknown as CacheStorage);
    await service.save({ version: 5, timestamp: 123, data: content });

    await service.clear();

    await expect(service.read()).resolves.toBeNull();
    expect(cacheStorage.names).toEqual(new Set(['another-wordpress-plugin']));
  });

  it('marks old cache as stale without treating it as expired', () => {
    const cached = { version: 5, timestamp: 100, data: content };
    expect(isCachedScreenContentStale(cached, 100 + CACHE_STALE_AFTER_MS + 1)).toBe(true);
    expect(cached.data).toBe(content);
  });
});
