import { describe, expect, it } from 'vitest';
import { MockDataStore, MockHeroesRepository } from '../../../src/mocks/repositories';

describe('MockHeroesRepository.getList', () => {
  it('searches heroes by name', async () => {
    const repository = new MockHeroesRepository(new MockDataStore());

    const result = await repository.getList({ search: 'белозерова' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ firstName: 'Валентина', lastName: 'Белозёрова' });
  });

  it('filters heroes by district', async () => {
    const store = new MockDataStore();
    const repository = new MockHeroesRepository(store);

    const result = await repository.getList({ districtId: 2, perPage: 100 });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((hero) => hero.districtId === 2)).toBe(true);
    expect(result.total).toBe(store.heroes.filter((hero) => hero.districtId === 2).length);
  });

  it('returns server-style pagination metadata', async () => {
    const store = new MockDataStore();
    const repository = new MockHeroesRepository(store);

    const result = await repository.getList({ page: 2, perPage: 5 });

    expect(result).toMatchObject({
      page: 2,
      perPage: 5,
      total: store.heroes.length,
      totalPages: Math.ceil(store.heroes.length / 5),
    });
    expect(result.items).toHaveLength(5);
  });
});
