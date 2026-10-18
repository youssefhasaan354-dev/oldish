import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawUrl = env.VITE_SITE_URL || 'https://oldish-chi.vercel.app';
  const siteUrl = rawUrl.replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_SITE_URL%/g, siteUrl);
        }
      }
    ],
    build: {
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, deps) => {
          return deps.filter(dep => 
            !dep.includes('vendor-firebase-auth') && 
            !dep.includes('vendor-firebase-firestore') && 
            !dep.includes('AdminLayout') && 
            !dep.includes('AdminLoginPage') && 
            !dep.includes('VisualSlotEditorModal')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
                return 'vendor-firebase-auth';
              }
              if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
                return 'vendor-firebase-firestore';
              }
              if (id.includes('firebase') || id.includes('@firebase')) {
                return 'vendor-firebase-core';
              }
              if (id.includes('qrcode')) {
                return 'vendor-qrcode';
              }
            }
          }
        }
      }
    }
  };
});
