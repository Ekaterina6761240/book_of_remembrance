import type { HeroesRepository } from '../../repositories';
import type { Hero, HeroFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
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
    const hero: Hero = { id: nextEntityId(this.heroes), ...clone(data) };
    this.heroes.push(hero);
    return clone(hero);
  }

  async update(id: number, data: HeroFormData): Promise<Hero> {
    const index = findEntityIndex(this.heroes, id);
    const hero: Hero = { id, ...clone(data) };
    this.heroes[index] = hero;
    return clone(hero);
  }

  async delete(id: number): Promise<void> {
    this.heroes.splice(findEntityIndex(this.heroes, id), 1);
  }
}
