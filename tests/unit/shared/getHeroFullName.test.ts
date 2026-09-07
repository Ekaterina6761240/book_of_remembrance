import { describe, expect, it } from 'vitest';
import type { Hero } from '../../../src/shared/types';
import { getHeroFullName } from '../../../src/shared/utils';

const createHero = (middleName?: string): Hero => ({
  id: 1,
  firstName: 'Иван',
  lastName: 'Панфилов',
  middleName,
  districtId: 1,
  gallery: [],
});

describe('getHeroFullName', () => {
  it('joins the last name, first name and middle name', () => {
    expect(getHeroFullName(createHero('Никитич'))).toBe('Панфилов Иван Никитич');
  });

  it('does not add extra whitespace when the middle name is absent', () => {
    expect(getHeroFullName(createHero())).toBe('Панфилов Иван');
  });
});
