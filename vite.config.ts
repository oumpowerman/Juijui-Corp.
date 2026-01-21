
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to resolve TS error about cwd missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for libraries that expect it
      'process.env': {},
      // Explicitly expose API_KEY for the GenAI compliance if needed, reading from VITE_GEMINI_API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
