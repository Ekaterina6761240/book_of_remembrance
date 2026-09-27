import { describe, expect, it } from 'vitest';
import type { Hero } from '../../../src/shared/types';
import { formatHeroLifeDates } from '../../../src/screen/utils/hero';

const createHero = (dates: Pick<Hero, 'birthDate' | 'deathDate'>): Hero => ({
  id: 1,
  firstName: 'Иван',
  lastName: 'Иванов',
  districtId: 1,
  gallery: [],
  status: 'published',
  ...dates,
});

describe('formatHeroLifeDates', () => {
  it('marks an unknown boundary when only one date is known', () => {
    expect(formatHeroLifeDates(createHero({ deathDate: '1984-02-22' })))
      .toBe('Неизвестно — 22 февраля 1984');
    expect(formatHeroLifeDates(createHero({ birthDate: '1915-05-15' })))
      .toBe('15 мая 1915 — неизвестно');
  });

  it('supports a known year without a month and day', () => {
    expect(formatHeroLifeDates(createHero({ birthDate: '1915', deathDate: '1984' })))
      .toBe('1915 — 1984');
  });
});
