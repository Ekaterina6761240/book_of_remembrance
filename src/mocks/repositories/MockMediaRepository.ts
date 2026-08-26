import type { MediaRepository } from '../../repositories';
import type { MediaFile, MediaFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { heroFixtures } from '../fixtures/heroes';

export class MockMediaRepository implements MediaRepository {
  private media: MediaFile[] = clone(
    heroFixtures.flatMap((hero) => [hero.mainImage, ...hero.gallery]).filter((item): item is MediaFile => item !== undefined),
  );

  async getAll(): Promise<MediaFile[]> {
    return clone(this.media);
  }

  async upload(data: MediaFormData): Promise<MediaFile> {
    const mediaFile: MediaFile = {
      id: nextEntityId(this.media),
      url: URL.createObjectURL(data.file),
      name: data.name ?? data.file.name,
    };
    this.media.push(mediaFile);
    return clone(mediaFile);
  }

  async delete(id: number): Promise<void> {
    this.media.splice(findEntityIndex(this.media, id), 1);
  }
}
