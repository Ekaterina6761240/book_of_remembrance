import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeAssetBase = (value: string | undefined): string => {
  const base = value?.trim() || '/';
  if (base === '.') return './';
  return base.endsWith('/') ? base : `${base}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: normalizeAssetBase(env.VITE_ASSET_BASE),
    plugins: [react()],
    build: {
      manifest: true,
    },
  };
});
