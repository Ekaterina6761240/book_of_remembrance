import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import {
  DistrictsService,
  HeroesService,
  MediaService,
  ScreenContentService,
  type Services,
} from '../../services';
import type { RepositoryContainer } from './runtime';

const ServicesContext = createContext<Services | null>(null);

const createServices = (repositories: RepositoryContainer): Services => ({
  districts: new DistrictsService(repositories.districts),
  heroes: new HeroesService(repositories.heroes),
  media: new MediaService(repositories.media),
  screenContent: new ScreenContentService(repositories.screenContent),
});

type ServicesProviderProps = PropsWithChildren<{
  repositories: RepositoryContainer;
}>;

export function ServicesProvider({ children, repositories }: ServicesProviderProps) {
  const [services] = useState(() => createServices(repositories));
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export const useServices = (): Services => {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return services;
};
