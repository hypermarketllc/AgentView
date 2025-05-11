import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/crm/',
  define: {
    'import.meta.env.VITE_USE_POSTGRES': JSON.stringify(process.env.VITE_USE_POSTGRES || 'true'),
    'import.meta.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH || '/crm')
  },
  build: {
    outDir: '../dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: [
        'react-router-dom',
        'jsonwebtoken',
        'uuid'
      ],
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    base: '/crm/',
    open: '/crm/'
  }
});
