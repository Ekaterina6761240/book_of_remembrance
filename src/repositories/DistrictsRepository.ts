import type { District, DistrictFormData } from '../shared/types';

export interface DistrictsRepository {
  getAll(): Promise<District[]>;
  getById(id: number): Promise<District>;
  create(data: DistrictFormData): Promise<District>;
  update(id: number, data: DistrictFormData): Promise<District>;
  delete(id: number): Promise<void>;
}
