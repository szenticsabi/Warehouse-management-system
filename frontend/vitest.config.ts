import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: 'src/front_tests/setupTests.ts',
    include: ['src/front_tests/**/*.test.{js,jsx,ts,tsx}'],
  },
})
