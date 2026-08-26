import type { MediaFile, MediaFormData } from '../shared/types';

export interface MediaRepository {
  getAll(): Promise<MediaFile[]>;
  upload(data: MediaFormData): Promise<MediaFile>;
  delete(id: number): Promise<void>;
}
