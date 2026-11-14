import { defineConfig } from 'vitest/config';

// The database tests (seed repeatability, F26B-32 edit verification) share one PostgreSQL database,
// so test files run one at a time instead of in parallel to keep their row counts from interfering.
export default defineConfig({
  test: {
    fileParallelism: false
  }
});
