// Configuración de desarrollo: cambia el puerto aquí y el destino de /api en proxy.
// Este proxy pertenece al servidor local de Vite; no sustituye la configuración de producción.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://20.106.154.149', changeOrigin: true } },
  },
});
