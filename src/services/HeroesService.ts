import type { HeroesRepository, HeroQuery, PagedResult } from '../repositories';
import type { Hero, HeroFormData } from '../shared/types';

export class HeroesService {
  constructor(private readonly repository: HeroesRepository) {}

  getList(query: HeroQuery): Promise<PagedResult<Hero>> {
    return this.repository.getList(query);
  }

  getById(id: number): Promise<Hero> {
    return this.repository.getById(id);
  }

  create(data: HeroFormData): Promise<Hero> {
    return this.repository.create(data);
  }

  update(id: number, data: HeroFormData): Promise<Hero> {
    return this.repository.update(id, data);
  }

  delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }
}
