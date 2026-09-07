import type { MediaFile } from './media';

export type HeroStatus = 'draft' | 'scheduled' | 'published';

export type Hero = {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  districtId: number;
  birthDate?: string;
  deathDate?: string;
  mainImage?: MediaFile;
  biography?: string;
  feat?: string;
  awards?: string;
  gallery: MediaFile[];
  status?: HeroStatus;
  publishedAt?: string;
};
