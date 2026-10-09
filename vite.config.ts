import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/steam-store': {
        target: 'https://store.steampowered.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam-store/, ''),
      },
      '/api/steam-api': {
        target: 'https://api.steampowered.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam-api/, ''),
      },
      '/api/steam-community': {
        target: 'https://steamcommunity.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam-community/, ''),
      },
      '/api/gog-embed': {
        target: 'https://embed.gog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gog-embed/, ''),
      },
    },
  }
});
