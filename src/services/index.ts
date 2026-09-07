export { AuthError } from './AuthService';
export type { AuthErrorCode, AuthService } from './AuthService';
export { DistrictsService } from './DistrictsService';
export { HeroesService } from './HeroesService';
export { MediaService } from './MediaService';
export { ScreenContentService } from './ScreenContentService';

import type { DistrictsService } from './DistrictsService';
import type { HeroesService } from './HeroesService';
import type { MediaService } from './MediaService';
import type { ScreenContentService } from './ScreenContentService';

export type Services = {
  districts: DistrictsService;
  heroes: HeroesService;
  media: MediaService;
  screenContent: ScreenContentService;
};
