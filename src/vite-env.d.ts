/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_BASE_PATH?: string;
  readonly VITE_ASSET_BASE?: string;
  readonly VITE_DATA_SOURCE?: 'mock' | 'wordpress';
  readonly VITE_SCREEN_IDLE_TIMEOUT_MS?: string;
  readonly VITE_WORDPRESS_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
