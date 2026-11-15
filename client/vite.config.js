import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true exposes the dev server on your LAN so phones can open the room link / QR code.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
