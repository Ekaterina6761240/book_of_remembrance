import type { ScreenContentRepository, ScreenContentSnapshot } from '../../repositories';
import { clone } from '../../shared/utils';
import type { ScreenContentCache } from './ScreenCacheService';

export type ScreenContentListener = (snapshot: ScreenContentSnapshot) => void;

export interface OfflineCapableScreenContentRepository extends ScreenContentRepository {
  subscribe(listener: ScreenContentListener): () => void;
  clearCache(): Promise<void>;
}

export class OfflineScreenContentRepository implements OfflineCapableScreenContentRepository {
  private activeSnapshot: ScreenContentSnapshot | null = null;
  private initialization: Promise<ScreenContentSnapshot> | null = null;
  private refresh: Promise<void> | null = null;
  private generation = 0;
  private readonly listeners = new Set<ScreenContentListener>();

  constructor(
    private readonly remote: ScreenContentRepository,
    private readonly cache: ScreenContentCache,
    private readonly now: () => number = Date.now,
  ) {}

  getSnapshot(): Promise<ScreenContentSnapshot> {
    if (this.activeSnapshot) {
      this.startBackgroundRefresh(this.activeSnapshot.version, this.generation);
      return Promise.resolve(clone(this.activeSnapshot));
    }
    if (!this.initialization) this.initialization = this.initialize();
    return this.initialization.then(clone);
  }

  async getVersion(): Promise<number> {
    return (await this.getSnapshot()).version;
  }

  subscribe(listener: ScreenContentListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async clearCache(): Promise<void> {
    const clearedGeneration = ++this.generation;
    await this.cache.clear();
    if (this.generation !== clearedGeneration) return;
    this.activeSnapshot = null;
    this.initialization = null;
    this.refresh = null;
  }

  private async initialize(): Promise<ScreenContentSnapshot> {
    const generation = this.generation;
    const cached = await this.cache.read();
    this.assertGeneration(generation);
    if (cached) {
      this.activeSnapshot = clone(cached.data);
      // Stale content remains valid offline; staleness is metadata, never expiry.
      this.startBackgroundRefresh(cached.version, generation);
      return clone(cached.data);
    }

    const remoteVersion = await this.remote.getVersion();
    const snapshot = await this.remote.getSnapshot();
    this.assertSnapshotIsCurrent(snapshot, remoteVersion);
    await this.activateAfterSave(snapshot, generation);
    return clone(snapshot);
  }

  private startBackgroundRefresh(cachedVersion: number, generation: number): void {
    if (this.refresh) return;
    this.refresh = this.refreshFromRemote(cachedVersion, generation).finally(() => {
      this.refresh = null;
    });
    void this.refresh.catch(() => undefined);
  }

  private async refreshFromRemote(cachedVersion: number, generation: number): Promise<void> {
    const remoteVersion = await this.remote.getVersion();
    this.assertGeneration(generation);
    if (remoteVersion === cachedVersion) return;

    const snapshot = await this.remote.getSnapshot();
    this.assertGeneration(generation);
    this.assertSnapshotIsCurrent(snapshot, remoteVersion);
    await this.activateAfterSave(snapshot, generation);
  }

  private assertSnapshotIsCurrent(snapshot: ScreenContentSnapshot, expectedMinimumVersion: number): void {
    if (snapshot.version < expectedMinimumVersion) {
      throw new Error('Screen content snapshot is older than the announced remote version');
    }
  }

  private async activateAfterSave(snapshot: ScreenContentSnapshot, generation: number): Promise<void> {
    this.assertGeneration(generation);
    await this.cache.save({
      version: snapshot.version,
      timestamp: this.now(),
      data: snapshot,
    });
    if (generation !== this.generation) {
      await this.cache.clear();
      this.assertGeneration(generation);
    }
    this.activeSnapshot = clone(snapshot);
    this.listeners.forEach((listener) => listener(clone(snapshot)));
    void this.cache.cacheMedia(snapshot).catch(() => undefined);
  }

  private assertGeneration(generation: number): void {
    if (generation !== this.generation) throw new Error('Screen cache operation was superseded');
  }
}
