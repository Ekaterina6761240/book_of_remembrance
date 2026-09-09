import type { DistrictsRepository } from '../../repositories';
import type { District, DistrictFormData } from '../../shared/types';
import type { WordPressApiClient } from '../client/WordPressApiClient';
import { mapDistrictDto, mapDistrictFormData } from '../mappers/districtMapper';
import { expectArray } from '../mappers/validation';

export class WordPressDistrictsRepository implements DistrictsRepository {
  constructor(private readonly client: WordPressApiClient) {}

  async getAll(): Promise<District[]> {
    const response = await this.client.request('/districts');
    return expectArray(response, 'district list DTO').map(mapDistrictDto);
  }

  async getById(id: number): Promise<District> {
    return mapDistrictDto(await this.client.request(`/districts/${id}`));
  }

  async create(data: DistrictFormData): Promise<District> {
    return mapDistrictDto(await this.client.request('/districts', {
      method: 'POST',
      body: mapDistrictFormData(data),
    }));
  }

  async update(id: number, data: DistrictFormData): Promise<District> {
    return mapDistrictDto(await this.client.request(`/districts/${id}`, {
      method: 'PUT',
      body: mapDistrictFormData(data),
    }));
  }

  async delete(id: number): Promise<void> {
    await this.client.request(`/districts/${id}`, { method: 'DELETE' });
  }
}
