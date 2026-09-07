import { describe, expect, it } from 'vitest';
import { MockDataStore, MockScreenContentRepository } from '../../../src/mocks/repositories';

describe('MockScreenContentRepository', () => {
  it('does not expose draft heroes in the public snapshot', async () => {
    const store = new MockDataStore();
    const draftHero = store.heroes.find((hero) => hero.status === 'draft');
    expect(draftHero).toBeDefined();

    const snapshot = await new MockScreenContentRepository(store).getSnapshot();

    expect(snapshot.heroes.some((hero) => hero.id === draftHero?.id)).toBe(false);
    expect(snapshot.heroes.every((hero) => hero.status === undefined)).toBe(true);
  });
});
