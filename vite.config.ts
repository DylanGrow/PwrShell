import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    open: false
  }
});
