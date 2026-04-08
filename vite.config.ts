import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        modulePreload: {
          resolveDependencies: (_filename, deps, context) => {
            if (context.hostType === 'html') {
              return deps.filter((dep) => !dep.includes('pdf-vendor'));
            }

            return deps;
          },
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (
                id === '\0vite/preload-helper.js' ||
                id === '\0vite/modulepreload-polyfill.js' ||
                id === '\0commonjsHelpers.js'
              ) {
                return 'vendor';
              }

              if (!id.includes('node_modules')) {
                return undefined;
              }

              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }

              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }

              if (
                id.includes('react-datepicker') ||
                id.includes('date-fns')
              ) {
                return 'datepicker-vendor';
              }

              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'pdf-vendor';
              }

              return 'vendor';
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
