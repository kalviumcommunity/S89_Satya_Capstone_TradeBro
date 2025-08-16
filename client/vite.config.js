import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://s89-satya-capstone-tradebro.onrender.com',
          changeOrigin: true,
          secure: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['framer-motion', 'react-icons']
          }
        }
      },
      cssCodeSplit: true,
      minify: 'terser',
      cssMinify: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  }
})
