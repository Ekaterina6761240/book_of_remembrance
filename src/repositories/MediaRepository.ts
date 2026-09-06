import type { MediaFile, MediaFormData } from '../shared/types';

export type MediaUploadProgressHandler = (progress: number) => void;

export interface MediaRepository {
  getAll(): Promise<MediaFile[]>;
  upload(data: MediaFormData, onProgress?: MediaUploadProgressHandler): Promise<MediaFile>;
  delete(id: number): Promise<void>;
}
