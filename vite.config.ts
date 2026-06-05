import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    // Resolve @ to the project root (allows imports like '@/components/...')
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // Proxy API calls to the CureForge backend during development
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },

      // HMR is disabled in AI Studio via the DISABLE_HMR env variable.
      // Do not modify – file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

    // Pre‑bundle packages that might be used outside Node (e.g. in the browser)
    // This avoids issues with CommonJS modules.
    optimizeDeps: {
      include: ['acorn', 'fast-check', 'seedrandom'],
    },
  };
}); 