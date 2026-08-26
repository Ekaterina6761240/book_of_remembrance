import type { MediaRepository } from '../repositories';
import type { MediaFile, MediaFormData } from '../shared/types';

export class MediaService {
  constructor(private readonly repository: MediaRepository) {}

  getAll(): Promise<MediaFile[]> {
    return this.repository.getAll();
  }

  upload(data: MediaFormData): Promise<MediaFile> {
    return this.repository.upload(data);
  }

  delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }
}
