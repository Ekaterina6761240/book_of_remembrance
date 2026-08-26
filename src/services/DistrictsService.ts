import type { DistrictsRepository } from '../repositories';
import type { District, DistrictFormData } from '../shared/types';

export class DistrictsService {
  constructor(private readonly repository: DistrictsRepository) {}

  getAll(): Promise<District[]> {
    return this.repository.getAll();
  }

  getById(id: number): Promise<District> {
    return this.repository.getById(id);
  }

  create(data: DistrictFormData): Promise<District> {
    return this.repository.create(data);
  }

  update(id: number, data: DistrictFormData): Promise<District> {
    return this.repository.update(id, data);
  }

  delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }
}
