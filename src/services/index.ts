export { AuthError } from './AuthService';
export type { AuthErrorCode, AuthService } from './AuthService';
export { DistrictsService } from './DistrictsService';
export { HeroesService } from './HeroesService';
export { MediaService } from './MediaService';

import type { DistrictsService } from './DistrictsService';
import type { HeroesService } from './HeroesService';
import type { MediaService } from './MediaService';

export type Services = {
  districts: DistrictsService;
  heroes: HeroesService;
  media: MediaService;
};
