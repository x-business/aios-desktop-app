import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { // Add the build configuration section
      rollupOptions: { // Specify rollup options
          input: { // Move the input object here
              // This key ('index') determines the output filename (index.mjs)
              index: 'src/preload/index.ts',
              // This key ('config-preload') determines the output filename (config-preload.mjs)
              'config-preload': 'src/preload/config-preload.ts'
          }
      }
  }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
