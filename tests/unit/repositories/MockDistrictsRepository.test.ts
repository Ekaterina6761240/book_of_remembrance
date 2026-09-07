import { describe, expect, it } from 'vitest';
import { MockDataStore, MockDistrictsRepository, MockHeroesRepository } from '../../../src/mocks/repositories';
import type { Hero, HeroFormData } from '../../../src/shared/types';

const toFormData = ({ id, ...hero }: Hero): HeroFormData => {
  void id;
  return { ...hero, status: hero.status ?? 'draft' };
};

describe('MockDistrictsRepository', () => {
  it('checks district relations against the current shared mock state', async () => {
    const store = new MockDataStore();
    const districts = new MockDistrictsRepository(store);
    const heroes = new MockHeroesRepository(store);
    const district = await districts.create({ name: 'Тестовый район', slug: 'test-district' });
    const template = await heroes.getById(1);
    const hero = await heroes.create({ ...toFormData(template), districtId: district.id });

    await expect(districts.delete(district.id)).rejects.toMatchObject({ status: 409 });

    await heroes.delete(hero.id);
    await expect(districts.delete(district.id)).resolves.toBeUndefined();
  });
});
