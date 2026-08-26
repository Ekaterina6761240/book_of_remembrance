import { MockDistrictsRepository, MockHeroesRepository, MockMediaRepository } from '../../mocks/repositories';
import type { DistrictsRepository, HeroesRepository, MediaRepository } from '../../repositories';

export type RepositoryContainer = {
  districts: DistrictsRepository;
  heroes: HeroesRepository;
  media: MediaRepository;
};

// Replace this factory with WordPress repository instances when the REST API is ready.
export const createRepositories = (): RepositoryContainer => ({
  districts: new MockDistrictsRepository(),
  heroes: new MockHeroesRepository(),
  media: new MockMediaRepository(),
});
