import type { HeroesRepository, HeroQuery, PagedResult } from '../../repositories';
import type { Hero, HeroFormData } from '../../shared/types';
import { clone, findEntityIndex, nextEntityId } from '../../shared/utils';
import { ApiError } from '../../api/ApiError';
import { MockDataStore } from './MockDataStore';
import { withEffectiveHeroStatus } from './heroPublication';

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

const normalizePositiveInteger = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isInteger(value) && value > 0 ? value : fallback;

const normalizeSearchText = (value: string): string =>
  value.trim().toLocaleUpperCase('ru-RU').replace(/Ё/g, 'Е');

const getSearchText = (hero: Hero): string => [
  [hero.lastName, hero.firstName, hero.middleName].filter(Boolean).join(' '),
  [hero.firstName, hero.middleName, hero.lastName].filter(Boolean).join(' '),
].join(' ');

const compareHeroes = (left: Hero, right: Hero): number => {
  const byLastName = left.lastName.localeCompare(right.lastName, 'ru-RU');
  if (byLastName !== 0) return byLastName;

  const byFirstName = left.firstName.localeCompare(right.firstName, 'ru-RU');
  return byFirstName || left.id - right.id;
};

export class MockHeroesRepository implements HeroesRepository {
  constructor(private readonly store = new MockDataStore()) {}

  async getList(query: HeroQuery): Promise<PagedResult<Hero>> {
    const requestedPage = normalizePositiveInteger(query.page, 1);
    const perPage = Math.min(normalizePositiveInteger(query.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE);
    const search = normalizeSearchText(query.search ?? '');
    const now = Date.now();
    this.store.refreshScheduledPublications(now);

    const filteredHeroes = this.store.heroes
      .map((hero) => withEffectiveHeroStatus(hero, now))
      .filter((hero) => !search || normalizeSearchText(getSearchText(hero)).includes(search))
      .filter((hero) => query.districtId === undefined || hero.districtId === query.districtId)
      .filter((hero) => query.status === undefined || hero.status === query.status)
      .sort((left, right) => compareHeroes(left, right) * (query.sortOrder === 'desc' ? -1 : 1));

    const total = filteredHeroes.length;
    const totalPages = Math.ceil(total / perPage);
    const page = Math.min(requestedPage, Math.max(totalPages, 1));
    const firstItemIndex = (page - 1) * perPage;

    return {
      items: clone(filteredHeroes.slice(firstItemIndex, firstItemIndex + perPage)),
      page,
      perPage,
      total,
      totalPages,
    };
  }

  async getById(id: number): Promise<Hero> {
    this.store.refreshScheduledPublications();
    const hero = this.store.heroes.find((item) => item.id === id);
    if (!hero) throw new ApiError(404, 'Герой не найден');
    return clone(withEffectiveHeroStatus(hero));
  }

  async create(data: HeroFormData): Promise<Hero> {
    this.assertSaveAvailable(data);
    const hero: Hero = { id: nextEntityId(this.store.heroes), ...clone(this.normalizePublication(data)) };
    this.store.heroes.push(hero);
    this.store.touch();
    return clone(withEffectiveHeroStatus(hero));
  }

  async update(id: number, data: HeroFormData): Promise<Hero> {
    this.assertSaveAvailable(data);
    const index = findEntityIndex(this.store.heroes, id);
    const hero: Hero = { id, ...clone(this.normalizePublication(data)) };
    this.store.heroes[index] = hero;
    this.store.touch();
    return clone(withEffectiveHeroStatus(hero));
  }

  async delete(id: number): Promise<void> {
    this.store.heroes.splice(findEntityIndex(this.store.heroes, id), 1);
    this.store.touch();
  }

  private assertSaveAvailable(data: HeroFormData): void {
    if (data.lastName.trim().toLowerCase() === 'api-error') {
      throw new ApiError(500, 'Не удалось сохранить героя. Попробуйте ещё раз.');
    }
  }

  private normalizePublication(data: HeroFormData): HeroFormData {
    if (data.status === 'draft') return { ...data, publishedAt: undefined };

    const publicationTimestamp = data.publishedAt ? Date.parse(data.publishedAt) : Number.NaN;
    if (data.status === 'scheduled' && !Number.isFinite(publicationTimestamp)) {
      throw new ApiError(422, 'Для отложенной публикации укажите корректную дату и время.');
    }

    if (Number.isFinite(publicationTimestamp) && publicationTimestamp > Date.now()) {
      return { ...data, status: 'scheduled' };
    }

    return { ...data, status: 'published' };
  }
}
