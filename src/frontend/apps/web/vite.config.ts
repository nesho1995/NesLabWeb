import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Salida al API: `dotnet run` en NesLab.Api sirve / y /api en el mismo origen (sin Vite, sin proxy).
// Con `npm run dev` (Vite) y VITE_API_BASE_URL vacio, /api se reenvia a NesLab.Api.
const outDir = '../../../backend/NesLab.Api/wwwroot';

const apiTarget = process.env.VITE_DEV_API_TARGET ?? 'http://127.0.0.1:5225';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      // Logos y estáticos publicados en NesLab.Api (wwwroot/uploads/...)
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
