import { appConfig } from '../../app/config';

const requestPersistentStorage = (): void => {
  if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return;
  void navigator.storage.persist().catch(() => false);
};

export const registerScreenServiceWorker = (): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const scopePath = appConfig.basePath === '/' ? '/' : `${appConfig.basePath}/`;

  window.addEventListener('load', () => {
    requestPersistentStorage();
    const serviceWorkerUrl = new URL(`${scopePath}sw.js`, window.location.origin);
    void navigator.serviceWorker.register(serviceWorkerUrl, { scope: scopePath });
  }, { once: true });
};
