import type { Hero, HeroFormData } from '../shared/types';

export interface HeroesRepository {
  getAll(): Promise<Hero[]>;
  getById(id: number): Promise<Hero>;
  create(data: HeroFormData): Promise<Hero>;
  update(id: number, data: HeroFormData): Promise<Hero>;
  delete(id: number): Promise<void>;
}
