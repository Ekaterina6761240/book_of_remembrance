import type { ScreenContentRepository, ScreenContentSnapshot } from '../repositories';
import type { OfflineCapableScreenContentRepository, ScreenContentListener } from '../screen/cache';

const isOfflineCapable = (
  repository: ScreenContentRepository,
): repository is OfflineCapableScreenContentRepository =>
  'subscribe' in repository && 'clearCache' in repository;

export class ScreenContentService {
  constructor(private readonly repository: ScreenContentRepository) {}

  getSnapshot(): Promise<ScreenContentSnapshot> {
    return this.repository.getSnapshot();
  }

  getVersion(): Promise<number> {
    return this.repository.getVersion();
  }

  subscribe(listener: ScreenContentListener): () => void {
    return isOfflineCapable(this.repository) ? this.repository.subscribe(listener) : () => undefined;
  }

  clearCache(): Promise<void> {
    return isOfflineCapable(this.repository) ? this.repository.clearCache() : Promise.resolve();
  }
}
