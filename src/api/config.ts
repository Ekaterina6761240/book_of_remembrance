import { getMuseumAppRuntimeConfig } from '../app/runtimeConfig';

const DEFAULT_API_BASE_URL = '/wp-json/museum/v1';

export const API_BASE_URL = getMuseumAppRuntimeConfig()?.restUrl
  ?? import.meta.env.VITE_API_BASE_URL
  ?? DEFAULT_API_BASE_URL;
