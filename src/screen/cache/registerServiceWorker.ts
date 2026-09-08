export const registerScreenServiceWorker = (): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  if (baseUrl.origin !== window.location.origin) return;

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', baseUrl);
    void navigator.serviceWorker.register(serviceWorkerUrl, { scope: baseUrl.pathname });
  }, { once: true });
};
