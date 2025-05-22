import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Ensure proper file extensions and formats
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Use standard ES modules
          format: 'es',
        },
      },
      // Copy Netlify configuration files to the dist folder
      copyPublicDir: true,
    },
    server: {
      port: 5173, // Use port 5173 for local development
      open: true,
      https: false, // Explicitly disable HTTPS
      host: 'localhost',
      force: true, // Force the server to serve as specified (HTTP)
    },
  }
})
