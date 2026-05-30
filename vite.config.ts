import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Emits dist/stats.html with a sunburst of bundle composition after
    // each production build. Open it locally; not deployed (dist/ is the
    // upload root but stats.html is harmless and helpful).
    visualizer({
      filename: 'dist/stats.html',
      template: 'sunburst',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
