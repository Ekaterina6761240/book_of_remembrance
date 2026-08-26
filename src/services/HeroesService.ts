import type { HeroesRepository } from '../repositories';
import type { Hero, HeroFormData } from '../shared/types';

export class HeroesService {
  constructor(private readonly repository: HeroesRepository) {}

  getAll(): Promise<Hero[]> {
    return this.repository.getAll();
  }

  async getPublished(): Promise<Hero[]> {
    const heroes = await this.repository.getAll();
    return heroes.filter((hero) => hero.status === 'published');
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
