import { describe, expect, it } from 'vitest';
import { getEffectiveHeroStatus } from '../../../src/mocks/repositories/heroPublication';
import type { Hero } from '../../../src/shared/types';

const scheduledHero = (publishedAt: string): Hero => ({
  id: 1,
  firstName: 'Иван',
  lastName: 'Панфилов',
  districtId: 1,
  gallery: [],
  status: 'scheduled',
  publishedAt,
});

describe('hero publication status', () => {
  const now = Date.parse('2026-09-07T12:00:00.000Z');

  it('keeps a future scheduled hero private', () => {
    expect(getEffectiveHeroStatus(scheduledHero('2026-09-08T12:00:00.000Z'), now)).toBe('scheduled');
  });

  it('publishes a scheduled hero when its publication time has passed', () => {
    expect(getEffectiveHeroStatus(scheduledHero('2026-09-06T12:00:00.000Z'), now)).toBe('published');
  });

  it('keeps legacy published records with a future date private', () => {
    const hero = { ...scheduledHero('2026-09-08T12:00:00.000Z'), status: 'published' as const };
    expect(getEffectiveHeroStatus(hero, now)).toBe('scheduled');
  });
});
