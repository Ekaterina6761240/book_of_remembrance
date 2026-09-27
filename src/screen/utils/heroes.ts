import type { Hero } from '../../shared/types';

export const RUSSIAN_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П',
  'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ы', 'Э', 'Ю', 'Я',
] as const;

const russianCollator = new Intl.Collator('ru-RU', {
  numeric: true,
  sensitivity: 'variant',
  usage: 'sort',
});

export const normalizeRussianText = (value: string): string =>
  value.trim().toLocaleUpperCase('ru-RU').replace(/Ё/g, 'Е');

const matchesNamePrefixes = (hero: Hero, query: string): boolean => {
  const queryParts = query.split(/\s+/).filter(Boolean);
  const nameParts = [hero.lastName, hero.firstName, hero.middleName]
    .filter((part): part is string => Boolean(part))
    .map(normalizeRussianText);

  return queryParts.every((queryPart) =>
    nameParts.some((namePart) => namePart.startsWith(queryPart)),
  );
};

export const compareHeroesRussian = (left: Hero, right: Hero): number => {
  const byLastName = russianCollator.compare(left.lastName.trim(), right.lastName.trim());
  if (byLastName !== 0) return byLastName;

  const byFirstName = russianCollator.compare(left.firstName.trim(), right.firstName.trim());
  if (byFirstName !== 0) return byFirstName;

  const byMiddleName = russianCollator.compare(left.middleName?.trim() ?? '', right.middleName?.trim() ?? '');
  return byMiddleName !== 0 ? byMiddleName : left.id - right.id;
};

type HeroFilterOptions = {
  districtId: number | null;
  firstLetter: string | null;
  query: string;
};

export const filterAndSortHeroes = (heroes: Hero[], options: HeroFilterOptions): Hero[] => {
  const normalizedQuery = normalizeRussianText(options.query);
  const normalizedLetter = options.firstLetter ? normalizeRussianText(options.firstLetter) : null;

  return heroes
    .filter((hero) => options.districtId === null || hero.districtId === options.districtId)
    .filter((hero) => !normalizedLetter || normalizeRussianText(hero.lastName).startsWith(normalizedLetter))
    .filter((hero) => !normalizedQuery || matchesNamePrefixes(hero, normalizedQuery))
    .sort(compareHeroesRussian);
};
