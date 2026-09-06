import type { HeroesRepository } from '../../repositories';
import type { Hero, HeroFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { ApiError } from '../../api/ApiError';
import { heroFixtures } from '../fixtures/heroes';

export class MockHeroesRepository implements HeroesRepository {
  private heroes: Hero[] = clone(heroFixtures);

  async getAll(): Promise<Hero[]> {
    return clone(this.heroes);
  }

  async getById(id: number): Promise<Hero> {
    return clone(this.heroes[findEntityIndex(this.heroes, id)]!);
  }

  async create(data: HeroFormData): Promise<Hero> {
    this.assertSaveAvailable(data);
    const hero: Hero = { id: nextEntityId(this.heroes), ...clone(data) };
    this.heroes.push(hero);
    return clone(hero);
  }

  async update(id: number, data: HeroFormData): Promise<Hero> {
    this.assertSaveAvailable(data);
    const index = findEntityIndex(this.heroes, id);
    const hero: Hero = { id, ...clone(data) };
    this.heroes[index] = hero;
    return clone(hero);
  }

  async delete(id: number): Promise<void> {
    this.heroes.splice(findEntityIndex(this.heroes, id), 1);
  }

  private assertSaveAvailable(data: HeroFormData): void {
    if (data.lastName.trim().toLowerCase() === 'api-error') {
      throw new ApiError(500, 'Не удалось сохранить героя. Попробуйте ещё раз.');
    }
  }
}
