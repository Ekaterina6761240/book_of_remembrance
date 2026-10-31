import type {
  DistrictsRepository,
  HeroesRepository,
  MediaRepository,
  ScreenContentRepository,
} from '../../repositories';
import { OfflineScreenContentRepository, ScreenCacheService } from '../../screen/cache';
import type { AuthService } from '../../services';
import { API_BASE_URL } from '../../api/config';
import {
  WordPressApiClient,
  WordPressAuthService,
  WordPressDistrictsRepository,
  WordPressHeroesRepository,
  WordPressMediaRepository,
  WordPressScreenContentRepository,
} from '../../wordpress';
import { getMuseumAppRuntimeConfig } from '../runtimeConfig';

export type RepositoryContainer = {
  districts: DistrictsRepository;
  heroes: HeroesRepository;
  media: MediaRepository;
  screenContent: ScreenContentRepository;
};

export type RuntimeAdapters = {
  auth: AuthService;
  repositories: RepositoryContainer;
};

export const createRuntimeAdapters = (): RuntimeAdapters => {
  const client = new WordPressApiClient(API_BASE_URL);
  const runtimeConfig = getMuseumAppRuntimeConfig();
  if (runtimeConfig?.nonce) client.setNonce(runtimeConfig.nonce);
  const remoteScreenContent = new WordPressScreenContentRepository(client);

  return {
    auth: new WordPressAuthService(client, runtimeConfig?.currentUser),
    repositories: {
      districts: new WordPressDistrictsRepository(client),
      heroes: new WordPressHeroesRepository(client),
      media: new WordPressMediaRepository(client),
      screenContent: new OfflineScreenContentRepository(
        remoteScreenContent,
        new ScreenCacheService(),
      ),
    },
  };
};
