import type { ScreenContentRepository, ScreenContentSnapshot } from '../../repositories';
import type { WordPressApiClient } from '../client/WordPressApiClient';
import { mapScreenSnapshotDto, mapScreenVersionDto } from '../mappers/screenContentMapper';

export class WordPressScreenContentRepository implements ScreenContentRepository {
  constructor(private readonly client: WordPressApiClient) {}

  async getSnapshot(): Promise<ScreenContentSnapshot> {
    return mapScreenSnapshotDto(await this.client.request('/screen', { authenticated: false }));
  }

  async getVersion(): Promise<number> {
    return mapScreenVersionDto(await this.client.request('/screen/version', { authenticated: false }));
  }
}
