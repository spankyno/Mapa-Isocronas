import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, /api/ors se reenvía a ORS añadiendo la clave en el servidor de Vite
// (la clave NUNCA llega al navegador). En producción lo hace api/ors.ts o el Worker.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/ors': {
          target: 'https://api.openrouteservice.org',
          changeOrigin: true,
          rewrite: () => '/v2/isochrones/driving-car',
          headers: { Authorization: env.ORS_API_KEY ?? '' },
        },
      },
    },
  }
})
