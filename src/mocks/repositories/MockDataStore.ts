import type { District, Hero } from '../../shared/types';
import { clone } from '../../shared/utils';
import { districtFixtures } from '../fixtures/districts';
import { heroFixtures } from '../fixtures/heroes';

export class MockDataStore {
  districts: District[] = clone(districtFixtures);
  heroes: Hero[] = clone(heroFixtures);
  version = 1;
  generatedAt = new Date().toISOString();

  refreshScheduledPublications(now = Date.now()): void {
    let hasChanges = false;

    this.heroes.forEach((hero) => {
      if (hero.status !== 'scheduled' || !hero.publishedAt) return;

      const publicationTimestamp = Date.parse(hero.publishedAt);
      if (Number.isFinite(publicationTimestamp) && publicationTimestamp <= now) {
        hero.status = 'published';
        hasChanges = true;
      }
    });

    if (hasChanges) this.touch();
  }

  touch(): void {
    this.version += 1;
    this.generatedAt = new Date().toISOString();
  }
}
