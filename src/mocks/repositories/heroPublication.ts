import type { Hero, HeroStatus } from '../../shared/types';

const getPublicationTimestamp = (hero: Pick<Hero, 'publishedAt'>): number | null => {
  if (!hero.publishedAt) return null;

  const timestamp = Date.parse(hero.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const getEffectiveHeroStatus = (hero: Hero, now = Date.now()): HeroStatus => {
  const publicationTimestamp = getPublicationTimestamp(hero);

  if (hero.status === 'scheduled') {
    return publicationTimestamp !== null && publicationTimestamp <= now ? 'published' : 'scheduled';
  }

  // Keep legacy/mock data with a future date private even if it was incorrectly
  // stored as published.
  if (hero.status === 'published' && publicationTimestamp !== null && publicationTimestamp > now) {
    return 'scheduled';
  }

  return hero.status ?? 'draft';
};

export const withEffectiveHeroStatus = (hero: Hero, now = Date.now()): Hero => ({
  ...hero,
  status: getEffectiveHeroStatus(hero, now),
});
