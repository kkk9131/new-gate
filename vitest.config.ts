import { defineConfig, configDefaults } from 'vitest/config';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(__dirname, '.env.local') });
loadEnv({ path: resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [...configDefaults.exclude, '**/.yoyo/**', 'tests/e2e/**'],
    coverage: {
      reporter: ['text'],
    },
  },
});
