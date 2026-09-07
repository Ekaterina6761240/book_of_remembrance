import type { MediaRepository, MediaUploadProgressHandler } from '../../repositories';
import type { MediaFile, MediaFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { ApiError } from '../../api/ApiError';
import { MockDataStore } from './MockDataStore';

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export class MockMediaRepository implements MediaRepository {
  private media: MediaFile[];

  constructor(store = new MockDataStore()) {
    this.media = clone(
      store.heroes.flatMap((hero) => [hero.mainImage, ...hero.gallery]).filter((item): item is MediaFile => item !== undefined),
    );
  }

  async getAll(): Promise<MediaFile[]> {
    return clone(this.media);
  }

  async upload(data: MediaFormData, onProgress?: MediaUploadProgressHandler): Promise<MediaFile> {
    onProgress?.(8);
    await wait(120);
    onProgress?.(34);
    await wait(120);
    if (data.file.name.toLowerCase().includes('api-error')) {
      throw new ApiError(500, 'Не удалось загрузить файл. Попробуйте ещё раз.');
    }
    onProgress?.(72);
    await wait(120);
    const mediaFile: MediaFile = {
      id: nextEntityId(this.media),
      url: URL.createObjectURL(data.file),
      name: data.name ?? data.file.name,
    };
    this.media.push(mediaFile);
    onProgress?.(100);
    return clone(mediaFile);
  }

  async delete(id: number): Promise<void> {
    this.media.splice(findEntityIndex(this.media, id), 1);
  }
}
