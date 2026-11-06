import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    // three.js va en su propio archivo y se baja recién al abrir la vista 3D
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
