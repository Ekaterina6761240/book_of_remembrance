import { describe, expect, it, vi } from 'vitest';
import type { ScreenContentRepository, ScreenContentSnapshot } from '../../../src/repositories';
import {
  CACHE_STALE_AFTER_MS,
  OfflineScreenContentRepository,
  type CachedScreenContent,
  type ScreenContentCache,
} from '../../../src/screen/cache';

const snapshot = (version: number): ScreenContentSnapshot => ({
  version,
  districts: [{ id: 1, name: `Район ${version}`, slug: `district-${version}` }],
  heroes: [],
});

class MemoryScreenCache implements ScreenContentCache {
  saved: CachedScreenContent | null;
  shouldFailSave = false;
  mediaVersions: number[] = [];
  clearCalls = 0;

  constructor(cached: CachedScreenContent | null) {
    this.saved = cached;
  }

  async read(): Promise<CachedScreenContent | null> {
    return this.saved;
  }

  async save(cached: CachedScreenContent): Promise<void> {
    if (this.shouldFailSave) throw new Error('Interrupted IndexedDB write');
    this.saved = cached;
  }

  async cacheMedia(value: ScreenContentSnapshot): Promise<void> {
    this.mediaVersions.push(value.version);
  }

  async clear(): Promise<void> {
    this.clearCalls += 1;
    this.saved = null;
  }
}

class RemoteScreenContent implements ScreenContentRepository {
  versionCalls = 0;
  snapshotCalls = 0;
  failVersion = false;
  failSnapshot = false;

  constructor(public current: ScreenContentSnapshot) {}

  async getVersion(): Promise<number> {
    this.versionCalls += 1;
    if (this.failVersion) throw new Error('Offline');
    return this.current.version;
  }

  async getSnapshot(): Promise<ScreenContentSnapshot> {
    this.snapshotCalls += 1;
    if (this.failSnapshot) throw new Error('Download interrupted');
    return this.current;
  }
}

const cached = (version: number, timestamp = 1_000): CachedScreenContent => ({
  version,
  timestamp,
  data: snapshot(version),
});

describe('OfflineScreenContentRepository', () => {
  it('saves and activates the first online snapshot', async () => {
    const cache = new MemoryScreenCache(null);
    const remote = new RemoteScreenContent(snapshot(1));
    const repository = new OfflineScreenContentRepository(remote, cache, () => 2_000);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    expect(cache.saved).toMatchObject({ version: 1, timestamp: 2_000 });
    expect(remote.versionCalls).toBe(1);
    expect(remote.snapshotCalls).toBe(1);
  });

  it('returns cached content and skips snapshot download when version is unchanged', async () => {
    const cache = new MemoryScreenCache(cached(2));
    const remote = new RemoteScreenContent(snapshot(2));
    const repository = new OfflineScreenContentRepository(remote, cache);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 2 });
    await vi.waitFor(() => expect(remote.versionCalls).toBe(1));
    expect(remote.snapshotCalls).toBe(0);
  });

  it('atomically replaces cached content when the remote version changes', async () => {
    const cache = new MemoryScreenCache(cached(1));
    const remote = new RemoteScreenContent(snapshot(2));
    const repository = new OfflineScreenContentRepository(remote, cache, () => 3_000);
    const listener = vi.fn();
    repository.subscribe(listener);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ version: 2 })));

    expect(cache.saved).toMatchObject({ version: 2, timestamp: 3_000 });
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 2 });
  });

  it('keeps the old snapshot active if a new snapshot download fails', async () => {
    const cache = new MemoryScreenCache(cached(1));
    const remote = new RemoteScreenContent(snapshot(2));
    remote.failSnapshot = true;
    const repository = new OfflineScreenContentRepository(remote, cache);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    await vi.waitFor(() => expect(remote.snapshotCalls).toBe(1));
    expect(cache.saved).toMatchObject({ version: 1 });
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
  });

  it('keeps cache older than seven days usable while offline', async () => {
    const now = CACHE_STALE_AFTER_MS + 10_000;
    const cache = new MemoryScreenCache(cached(3, 1));
    const remote = new RemoteScreenContent(snapshot(4));
    remote.failVersion = true;
    const repository = new OfflineScreenContentRepository(remote, cache, () => now);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 3 });
    await vi.waitFor(() => expect(remote.versionCalls).toBe(1));
    expect(cache.saved).toMatchObject({ version: 3 });
  });

  it('does not activate a downloaded snapshot if its atomic save fails', async () => {
    const cache = new MemoryScreenCache(cached(1));
    cache.shouldFailSave = true;
    const remote = new RemoteScreenContent(snapshot(2));
    const repository = new OfflineScreenContentRepository(remote, cache);
    const listener = vi.fn();
    repository.subscribe(listener);

    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
    await vi.waitFor(() => expect(remote.snapshotCalls).toBe(1));
    expect(listener).not.toHaveBeenCalled();
    expect(cache.saved).toMatchObject({ version: 1 });
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 1 });
  });

  it('clears persisted and in-memory cache before the next startup', async () => {
    const cache = new MemoryScreenCache(cached(1));
    const remote = new RemoteScreenContent(snapshot(1));
    const repository = new OfflineScreenContentRepository(remote, cache);
    await repository.getSnapshot();

    await repository.clearCache();

    expect(cache.clearCalls).toBe(1);
    remote.current = snapshot(2);
    await expect(repository.getSnapshot()).resolves.toMatchObject({ version: 2 });
  });
});
