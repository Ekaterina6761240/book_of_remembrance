import type { ScreenContentRepository, ScreenContentSnapshot } from '../../repositories';
import type { Hero } from '../../shared/types';
import { clone } from '../../shared/utils';
import { MockDataStore } from './MockDataStore';
import { getEffectiveHeroStatus } from './heroPublication';

const toPublicHero = (hero: Hero): Hero => {
  const publicHero = clone(hero);
  delete publicHero.status;
  delete publicHero.publishedAt;
  return publicHero;
};

export class MockScreenContentRepository implements ScreenContentRepository {
  constructor(private readonly store = new MockDataStore()) {}

  async getSnapshot(): Promise<ScreenContentSnapshot> {
    const now = Date.now();
    this.store.refreshScheduledPublications(now);
    const heroes = this.store.heroes
      .filter((hero) => getEffectiveHeroStatus(hero, now) === 'published')
      .map(toPublicHero);

    return clone({
      version: this.store.version,
      districts: [...this.store.districts]
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)),
      heroes,
      generatedAt: this.store.generatedAt,
    });
  }

  async getVersion(): Promise<number> {
    this.store.refreshScheduledPublications();
    return this.store.version;
  }
}
