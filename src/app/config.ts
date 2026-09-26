import { getMuseumAppRuntimeConfig } from './runtimeConfig';

const normalizeAppBasePath = (value: string | undefined): string => {
  const path = value?.trim() || '/';
  if (path === '/') return '/';

  return `/${path.replace(/^\/+|\/+$/g, '')}`;
};

export type DataSourceMode = 'mock' | 'wordpress';

export const resolveDataSourceMode = (
  value: string | undefined,
  isDevelopment: boolean,
): DataSourceMode => {
  if (value === 'mock' || value === 'wordpress') return value;
  if (isDevelopment) return 'mock';

  throw new Error(
    'VITE_DATA_SOURCE must be explicitly set to "wordpress" or "mock" for production.',
  );
};

export const appConfig = Object.freeze({
  basePath: normalizeAppBasePath(
    getMuseumAppRuntimeConfig()?.appBasePath ?? import.meta.env.VITE_APP_BASE_PATH,
  ),
  dataSource: resolveDataSourceMode(import.meta.env.VITE_DATA_SOURCE, import.meta.env.DEV),
});
