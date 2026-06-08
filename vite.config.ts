
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { BRAND_CONFIG } from './config/brand.ts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to resolve TS error about cwd missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: BRAND_CONFIG.name,
          short_name: BRAND_CONFIG.title,
          description: BRAND_CONFIG.description,
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          share_target: {
            action: '/share_target',
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: {
              title: 'title',
              text: 'text',
              url: 'url'
            }
          },
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api/, /^\/auth/],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        }
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/<title>(.*?)<\/title>/, `<title>${BRAND_CONFIG.name}</title>`)
                     .replace(/<h1 class="loader-title">(.*?)<\/h1>/, `<h1 class="loader-title">${BRAND_CONFIG.name}</h1>`)
                     .replace(/<meta name="apple-mobile-web-app-title" content="(.*?)">/, `<meta name="apple-mobile-web-app-title" content="${BRAND_CONFIG.title}">`);
        }
      }
    ],
    define: {
      // Polyfill process.env for libraries that expect it
      'process.env': {},
      // Expose environment variables to the client
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || ''),
      'import.meta.env.VITE_GOOGLE_PICKER_API_KEY': JSON.stringify(env.VITE_GOOGLE_PICKER_API_KEY || env.GOOGLE_PICKER_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '')
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
