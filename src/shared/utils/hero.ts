import type { Hero } from '../types';

export const getHeroFullName = (hero: Hero): string =>
  [hero.lastName, hero.firstName, hero.middleName].filter(Boolean).join(' ');
