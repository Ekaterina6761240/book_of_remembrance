import type { DistrictsRepository } from '../../repositories';
import { ApiError } from '../../api/ApiError';
import type { District, DistrictFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { MockDataStore } from './MockDataStore';

const DELETE_CONFLICT_MESSAGE = 'Невозможно удалить район, если к нему привязаны герои.';

export class MockDistrictsRepository implements DistrictsRepository {
  constructor(private readonly store = new MockDataStore()) {}

  async getAll(): Promise<District[]> {
    return clone(this.store.districts).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getById(id: number): Promise<District> {
    const district = this.store.districts[findEntityIndex(this.store.districts, id)];
    if (!district) throw new Error(`District with id ${id} was not found`);
    return clone(district);
  }

  async create(data: DistrictFormData): Promise<District> {
    this.assertSlugIsUnique(data.slug);
    const district: District = { id: nextEntityId(this.store.districts), ...clone(data) };
    this.store.districts.push(district);
    this.store.touch();
    return clone(district);
  }

  async update(id: number, data: DistrictFormData): Promise<District> {
    const index = findEntityIndex(this.store.districts, id);
    this.assertSlugIsUnique(data.slug, id);
    const district: District = { id, ...clone(data) };
    this.store.districts[index] = district;
    this.store.touch();
    return clone(district);
  }

  async delete(id: number): Promise<void> {
    findEntityIndex(this.store.districts, id);
    if (this.store.heroes.some((hero) => hero.districtId === id)) {
      throw new ApiError(409, DELETE_CONFLICT_MESSAGE);
    }
    this.store.districts.splice(findEntityIndex(this.store.districts, id), 1);
    this.store.touch();
  }

  private assertSlugIsUnique(slug: string, ignoredId?: number): void {
    const normalizedSlug = slug.trim().toLowerCase();
    const duplicate = this.store.districts.some((district) =>
      district.id !== ignoredId && district.slug.toLowerCase() === normalizedSlug,
    );
    if (duplicate) {
      throw new ApiError(422, 'Район с таким ярлыком уже существует.');
    }
  }
}
