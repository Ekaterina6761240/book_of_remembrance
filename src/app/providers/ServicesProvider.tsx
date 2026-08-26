import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { DistrictsService, HeroesService, MediaService, type Services } from '../../services';
import { createRepositories } from './repositories';

const ServicesContext = createContext<Services | null>(null);

const createServices = (): Services => {
  const repositories = createRepositories();
  return {
    districts: new DistrictsService(repositories.districts),
    heroes: new HeroesService(repositories.heroes),
    media: new MediaService(repositories.media),
  };
};

export function ServicesProvider({ children }: PropsWithChildren) {
  const [services] = useState(createServices);
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export const useServices = (): Services => {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return services;
};
