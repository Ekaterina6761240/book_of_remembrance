import { describe, expect, it } from 'vitest';
import type { Hero } from '../../../src/shared/types';
import { filterAndSortHeroes } from '../../../src/screen/utils/heroes';

const hero: Hero = {
  id: 1,
  firstName: 'Иван',
  lastName: 'Петров',
  middleName: 'Сергеевич',
  districtId: 1,
  gallery: [],
  status: 'published',
};

const search = (query: string) => filterAndSortHeroes([hero], {
  districtId: null,
  firstLetter: null,
  query,
});

describe('filterAndSortHeroes search', () => {
  it('matches the beginning of name parts', () => {
    expect(search('пет ив')).toEqual([hero]);
    expect(search('сер')).toEqual([hero]);
  });

  it('does not match a sequence inside a name part', () => {
    expect(search('етров')).toEqual([]);
    expect(search('ван')).toEqual([]);
  });
});
