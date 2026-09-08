import {
  MockDataStore,
  MockDistrictsRepository,
  MockHeroesRepository,
  MockMediaRepository,
  MockScreenContentRepository,
} from '../../mocks/repositories';
import { MockAuthService } from '../../mocks/services/MockAuthService';
import type {
  DistrictsRepository,
  HeroesRepository,
  MediaRepository,
  ScreenContentRepository,
} from '../../repositories';
import { OfflineScreenContentRepository, ScreenCacheService } from '../../screen/cache';
import type { AuthService } from '../../services';
import { appConfig, type DataSourceMode } from '../config';

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

const createMockAdapters = (): RuntimeAdapters => {
  const store = new MockDataStore();
  const remoteScreenContent = new MockScreenContentRepository(store);

  return {
    auth: new MockAuthService(),
    repositories: {
      districts: new MockDistrictsRepository(store),
      heroes: new MockHeroesRepository(store),
      media: new MockMediaRepository(store),
      screenContent: new OfflineScreenContentRepository(
        remoteScreenContent,
        new ScreenCacheService(),
      ),
    },
  };
};

export const createRuntimeAdapters = (
  mode: DataSourceMode = appConfig.dataSource,
): RuntimeAdapters => {
  if (mode === 'mock') return createMockAdapters();

  throw new Error(
    'WordPress adapters are not implemented yet. Configure them in the runtime composition root before using VITE_DATA_SOURCE=wordpress.',
  );
};
