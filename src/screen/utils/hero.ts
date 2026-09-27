import type { Hero, MediaFile } from '../../shared/types';

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const formatHeroDate = (value?: string): string => {
  if (!value) return '';
  if (/^\d{4}$/.test(value)) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const month = Number(match[2]) - 1;
  return `${Number(match[3])} ${MONTHS[month] ?? match[2]} ${match[1]}`;
};

export const formatHeroLifeDates = (hero: Hero): string => {
  const birthDate = formatHeroDate(hero.birthDate);
  const deathDate = formatHeroDate(hero.deathDate);
  if (!birthDate && !deathDate) return 'Даты жизни не указаны';
  return `${birthDate || 'Неизвестно'} — ${deathDate || 'неизвестно'}`;
};

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
