import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Logic tests run in plain Node; only component tests pay for jsdom, which is slow
    // to start (tens of seconds per run on Windows). A .ts test that needs browser APIs
    // can opt in with a `// @vitest-environment jsdom` comment at the top of the file.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts', './src/test/setup-dom.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html'],
      // 80% overall; stricter per-file thresholds for cart logic and money helpers are added
      // with those files (see CLAUDE.md → Testing).
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
