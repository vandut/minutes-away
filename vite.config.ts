import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        includeAssets: [
          'icons/favicon.ico',
          'icons/apple-touch-icon.png',
          'icons/pwa-192x192.png',
          'icons/pwa-512x512.png',
          'icons/pwa-maskable-192x192.png',
          'icons/pwa-maskable-512x512.png',
        ],
        manifest: {
          name: 'MinutesAway',
          short_name: 'MinutesAway',
          description:
            'An advanced, personal mapping tool for desktop browsers, designed for interactive exploration and visual analysis of pedestrian accessibility in a chosen urban area. It allows users to place points of interest, organize them into categories, and visualize time-based reach maps (isochrones).',
          theme_color: '#334155',
          background_color: '#1E293B',
          icons: [
            {
              src: 'icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    base: '/minutes-away/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
