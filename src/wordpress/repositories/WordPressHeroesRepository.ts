import type { HeroesRepository, HeroQuery, PagedResult } from '../../repositories';
import type { Hero, HeroFormData } from '../../shared/types';
import type { WordPressApiClient } from '../client/WordPressApiClient';
import { mapHeroDto, mapHeroFormData, mapPagedHeroesDto } from '../mappers/heroMapper';

const toQueryString = (query: HeroQuery): string => {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.perPage !== undefined) params.set('per_page', String(query.perPage));
  if (query.search !== undefined) params.set('search', query.search);
  if (query.districtId !== undefined) params.set('district_id', String(query.districtId));
  if (query.status !== undefined) params.set('status', query.status);
  if (query.sortOrder !== undefined) params.set('order', query.sortOrder);
  const value = params.toString();
  return value ? `?${value}` : '';
};

export class WordPressHeroesRepository implements HeroesRepository {
  constructor(private readonly client: WordPressApiClient) {}

  async getList(query: HeroQuery): Promise<PagedResult<Hero>> {
    return mapPagedHeroesDto(await this.client.request(`/heroes${toQueryString(query)}`));
  }

  async getById(id: number): Promise<Hero> {
    return mapHeroDto(await this.client.request(`/heroes/${id}`));
  }

  async create(data: HeroFormData): Promise<Hero> {
    return mapHeroDto(await this.client.request('/heroes', {
      method: 'POST',
      body: mapHeroFormData(data),
    }));
  }

  async update(id: number, data: HeroFormData): Promise<Hero> {
    return mapHeroDto(await this.client.request(`/heroes/${id}`, {
      method: 'PUT',
      body: mapHeroFormData(data),
    }));
  }

  async delete(id: number): Promise<void> {
    await this.client.request(`/heroes/${id}`, { method: 'DELETE' });
  }
}
