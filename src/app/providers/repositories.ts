import {
  MockDataStore,
  MockDistrictsRepository,
  MockHeroesRepository,
  MockMediaRepository,
  MockScreenContentRepository,
} from '../../mocks/repositories';
import type {
  DistrictsRepository,
  HeroesRepository,
  MediaRepository,
  ScreenContentRepository,
} from '../../repositories';

export type RepositoryContainer = {
  districts: DistrictsRepository;
  heroes: HeroesRepository;
  media: MediaRepository;
  screenContent: ScreenContentRepository;
};

// Replace this factory with WordPress repository instances when the REST API is ready.
export const createRepositories = (): RepositoryContainer => {
  const store = new MockDataStore();

  return {
    districts: new MockDistrictsRepository(store),
    heroes: new MockHeroesRepository(store),
    media: new MockMediaRepository(store),
    screenContent: new MockScreenContentRepository(store),
  };
};
