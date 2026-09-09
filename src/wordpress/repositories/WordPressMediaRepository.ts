import type { MediaRepository, MediaUploadProgressHandler } from '../../repositories';
import type { MediaFile, MediaFormData } from '../../shared/types';
import type { WordPressApiClient } from '../client/WordPressApiClient';
import { mapMediaDto } from '../mappers/mediaMapper';
import { expectArray } from '../mappers/validation';

export class WordPressMediaRepository implements MediaRepository {
  constructor(private readonly client: WordPressApiClient) {}

  async getAll(): Promise<MediaFile[]> {
    const response = await this.client.request('/media');
    return expectArray(response, 'media list DTO').map(mapMediaDto);
  }

  async upload(data: MediaFormData, onProgress?: MediaUploadProgressHandler): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.name !== undefined) formData.append('name', data.name);
    return mapMediaDto(await this.client.upload('/media', formData, { onProgress }));
  }

  async delete(id: number): Promise<void> {
    await this.client.request(`/media/${id}`, { method: 'DELETE' });
  }
}
