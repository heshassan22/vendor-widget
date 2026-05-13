import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'index.html'),
        loader: path.resolve(__dirname, 'src/widget/loader.ts'),
        widget: path.resolve(__dirname, 'src/widget/widget.ts'),
      },
      output: {
        entryFileNames: 'widget/[name].js',
      },
      external: ['/widget/widget.js'],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/configs': 'http://localhost:3000',
      '/widget': 'http://localhost:3000',
      '/demo': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
