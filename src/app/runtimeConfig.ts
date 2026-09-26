import type { User } from '../shared/types';

export type MuseumAppRuntimeConfig = {
  restUrl: string;
  appBasePath: string;
  nonce: string | null;
  currentUser: User | null;
};

declare global {
  interface Window {
    MuseumAppConfig?: MuseumAppRuntimeConfig;
  }
}

export const getMuseumAppRuntimeConfig = (): MuseumAppRuntimeConfig | null =>
  typeof window === 'undefined' ? null : window.MuseumAppConfig ?? null;
