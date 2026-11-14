import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Self-contained test build of the Role 3 components. Vercel runs `npm run build` and serves `dist`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@src': path.resolve(__dirname, 'src') },
  },
});
