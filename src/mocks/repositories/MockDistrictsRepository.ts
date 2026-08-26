import type { DistrictsRepository } from '../../repositories';
import { ApiError } from '../../api/ApiError';
import type { District, DistrictFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { districtFixtures } from '../fixtures/districts';
import { heroFixtures } from '../fixtures/heroes';

const DELETE_CONFLICT_MESSAGE = 'Невозможно удалить район, если к нему привязаны герои.';

export class MockDistrictsRepository implements DistrictsRepository {
  private districts: District[] = clone(districtFixtures);

  async getAll(): Promise<District[]> {
    return clone(this.districts).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getById(id: number): Promise<District> {
    return clone(this.districts[findEntityIndex(this.districts, id)]!);
  }

  async create(data: DistrictFormData): Promise<District> {
    this.assertSlugIsUnique(data.slug);
    const district: District = { id: nextEntityId(this.districts), ...clone(data) };
    this.districts.push(district);
    return clone(district);
  }

  async update(id: number, data: DistrictFormData): Promise<District> {
    const index = findEntityIndex(this.districts, id);
    this.assertSlugIsUnique(data.slug, id);
    const district: District = { id, ...clone(data) };
    this.districts[index] = district;
    return clone(district);
  }

  async delete(id: number): Promise<void> {
    findEntityIndex(this.districts, id);
    if (heroFixtures.some((hero) => hero.districtId === id)) {
      throw new ApiError(409, DELETE_CONFLICT_MESSAGE);
    }
    this.districts.splice(findEntityIndex(this.districts, id), 1);
  }

  private assertSlugIsUnique(slug: string, ignoredId?: number): void {
    const normalizedSlug = slug.trim().toLowerCase();
    const duplicate = this.districts.some((district) =>
      district.id !== ignoredId && district.slug.toLowerCase() === normalizedSlug,
    );
    if (duplicate) {
      throw new ApiError(422, 'Район с таким ярлыком уже существует.');
    }
  }
}
