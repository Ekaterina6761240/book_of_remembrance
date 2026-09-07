import type { Hero, HeroFormData, HeroStatus } from '../shared/types';

export type HeroQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  districtId?: number;
  status?: HeroStatus;
  sortOrder?: 'asc' | 'desc';
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export interface HeroesRepository {
  getList(query: HeroQuery): Promise<PagedResult<Hero>>;
  getById(id: number): Promise<Hero>;
  create(data: HeroFormData): Promise<Hero>;
  update(id: number, data: HeroFormData): Promise<Hero>;
  delete(id: number): Promise<void>;
}
