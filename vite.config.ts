import { defineConfig } from 'vite';

// In dev, forward /api to the Hono server so the client only ever talks to the BFF.
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:8787' } },
});
