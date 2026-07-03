import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, '../dist-electron/main'),
    lib: {
      entry: path.resolve(__dirname, './main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.cjs',
    },
    rollupOptions: {
      external: [
        'electron',
        'path',
        'fs',
        'electron-store',
        'nodemailer',
        'googleapis',
        'axios',
        'csv-parse/sync',
      ],
    },
  },
});
