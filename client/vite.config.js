import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React 19 compatibility settings
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Remove jsx: true to fix the non-boolean attribute error
      babel: {
        plugins: [
          // Add babel plugins for React 19 compatibility if needed
        ]
      }
    })
  ],
  define: {
    // React 19 compatibility - avoid setting read-only properties
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'react-icons/fi'
    ],
    exclude: []
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        // Ensure proper MIME types for ES modules
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'https://s89-satya-capstone-tradebro.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
=======
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
>>>>>>> b1a8bb87a9f2e1b3c2ce0c8518a40cf83a513f40
  }
})
