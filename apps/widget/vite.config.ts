// vite.config.ts - Widget build config
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.ts'),
      name: 'AIChatbotWidget',
      fileName: 'chatbot-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Shadow DOM 用: CSS を JS に inlined
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    outDir: 'dist',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
