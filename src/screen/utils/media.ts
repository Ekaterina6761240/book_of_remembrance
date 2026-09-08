import type { MediaFile } from '../../shared/types';

export const getOptimizedScreenMediaUrl = (media: MediaFile): string =>
  media.thumbnailUrl ?? media.url;
