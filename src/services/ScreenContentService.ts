import type { ScreenContentRepository, ScreenContentSnapshot } from '../repositories';

export class ScreenContentService {
  constructor(private readonly repository: ScreenContentRepository) {}

  getSnapshot(): Promise<ScreenContentSnapshot> {
    return this.repository.getSnapshot();
  }

  getVersion(): Promise<number> {
    return this.repository.getVersion();
  }
}
