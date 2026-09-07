import type { District } from './district';
import type { Hero, HeroStatus } from './hero';
import type { MediaFile } from './media';

export type DistrictFormData = Omit<District, 'id'>;

export type HeroFormData = Omit<Hero, 'id' | 'gallery' | 'status'> & {
  gallery: MediaFile[];
  status: HeroStatus;
};

export type MediaFormData = {
  file: File;
  name?: string;
};
