import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { vitePluginForArco as arcoPlugin } from '@arco-plugins/vite-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    arcoPlugin({
      style: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/api/v1'),
      },
    },
  },
});
