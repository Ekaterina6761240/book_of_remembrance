import { getMuseumAppRuntimeConfig } from './runtimeConfig';

const normalizeAppBasePath = (value: string | undefined): string => {
  const path = value?.trim() || '/';
  if (path === '/') return '/';

  return `/${path.replace(/^\/+|\/+$/g, '')}`;
};

export const appConfig = Object.freeze({
  basePath: normalizeAppBasePath(
    getMuseumAppRuntimeConfig()?.appBasePath ?? import.meta.env.VITE_APP_BASE_PATH,
  ),
});
