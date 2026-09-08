import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeAssetBase = (value: string | undefined): string => {
  const base = value?.trim() || '/';
  if (base === '.') return './';
  return base.endsWith('/') ? base : `${base}/`;
};

const isShellAsset = (fileName: string): boolean =>
  /\.(?:css|js|mjs|woff2?|otf|ttf|svg|png|jpe?g|webp|gif|ico)$/i.test(fileName);

const createServiceWorkerSource = (files: string[], revision: string): string => `
const APP_CACHE_PREFIX = 'book-of-remembrance-';
const SHELL_CACHE = APP_CACHE_PREFIX + 'shell-${revision}';
const MEDIA_CACHE = APP_CACHE_PREFIX + 'screen-media-v1';
const PRECACHE_PATHS = ${JSON.stringify(files)};
const toScopeUrl = (path) => new URL(path, self.registration.scope).href;
const PRECACHE_URLS = PRECACHE_PATHS.map(toScopeUrl);
const SHELL_ENTRY = toScopeUrl('index.html');
const trimTrailingSlash = (path) => path.endsWith('/') ? path.slice(0, -1) : path;
const SCREEN_ROOT = trimTrailingSlash(new URL('screen', self.registration.scope).pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith(APP_CACHE_PREFIX) && name !== SHELL_CACHE && name !== MEDIA_CACHE)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    const pathname = trimTrailingSlash(new URL(request.url).pathname);
    if (pathname !== SCREEN_ROOT && !pathname.startsWith(SCREEN_ROOT + '/')) return;
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(SHELL_ENTRY, response.clone());
          }
          return response;
        })
        .catch(async () => (await caches.match(SHELL_ENTRY)) || Response.error()),
    );
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          const cache = await caches.open(MEDIA_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  if (PRECACHE_URLS.includes(request.url)) {
    event.respondWith(caches.match(request, { ignoreVary: true }).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    }));
  }
});
`;

const offlineShellPlugin = (): Plugin => ({
  name: 'book-of-remembrance-offline-shell',
  apply: 'build',
  generateBundle(_options, bundle) {
    const files = ['index.html', ...Object.values(bundle)
      .map((output) => output.fileName)
      .filter(isShellAsset)]
      .filter((fileName, index, allFiles) => allFiles.indexOf(fileName) === index)
      .sort();
    const revision = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
    this.emitFile({
      type: 'asset',
      fileName: 'sw.js',
      source: createServiceWorkerSource(files, revision),
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: normalizeAssetBase(env.VITE_ASSET_BASE),
    plugins: [react(), offlineShellPlugin()],
    build: {
      manifest: true,
    },
  };
});
