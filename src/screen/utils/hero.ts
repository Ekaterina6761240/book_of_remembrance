import type { Hero, MediaFile } from '../../shared/types';

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const formatHeroDate = (value?: string): string => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const month = Number(match[2]) - 1;
  return `${Number(match[3])} ${MONTHS[month] ?? match[2]} ${match[1]}`;
};

export const formatHeroLifeDates = (hero: Hero): string => {
  const dates = [formatHeroDate(hero.birthDate), formatHeroDate(hero.deathDate)].filter(Boolean);
  return dates.length ? dates.join(' — ') : 'Даты жизни не указаны';
};

export const getHeroFullName = (hero: Hero): string =>
  [hero.lastName, hero.firstName, hero.middleName].filter(Boolean).join(' ');

export const getHeroMedia = (hero: Hero): MediaFile[] => {
  const result: MediaFile[] = [];
  const ids = new Set<number>();
  for (const media of [hero.mainImage, ...hero.gallery]) {
    if (media && !ids.has(media.id)) {
      ids.add(media.id);
      result.push(media);
    }
  }
  return result;
};
