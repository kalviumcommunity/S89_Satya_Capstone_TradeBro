import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react({
        // React 19 compatibility settings
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        babel: {
          plugins: [
            // Add babel plugins for React 19 compatibility if needed
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
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
      sourcemap: mode === 'development',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
          // Ensure proper file extensions and formats
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Use standard ES modules
          format: 'es',
        },
        // Handle external dependencies and platform-specific modules
        external: (id) => {
          // Don't bundle platform-specific rollup binaries
          if (id.includes('@rollup/rollup-')) return true
          return false
        }
      },
      // Copy Netlify configuration files to the dist folder
      copyPublicDir: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      open: true,
      https: false,
      proxy: {
        '/api': {
          target: 'https://s89-satya-capstone-tradebro.onrender.com',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
