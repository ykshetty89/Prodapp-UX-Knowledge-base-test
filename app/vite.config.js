import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /<repo-name>/ so set base accordingly
  base: '/Prodapp-UX-Knowledge-base-test/',
});
