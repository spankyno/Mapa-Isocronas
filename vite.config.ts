import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, /api/ors se reenvía a ORS añadiendo la clave en el servidor de Vite
// (la clave NUNCA llega al navegador). En producción lo hace api/ors.ts o el Worker.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    // Expone al cliente solo VITE_* y CLERK_PUBLISHABLE_* (nunca CLERK_SECRET_KEY ni ORS_API_KEY)
    envPrefix: ['VITE_', 'CLERK_PUBLISHABLE_'],
    server: {
      proxy: {
        '/api/carto': {
          target: 'https://basemaps.cartocdn.com', changeOrigin: true,
          rewrite: (p: string) => { const q = new URL(p, 'http://x').searchParams
            return `/rastertiles/light_all/${q.get('z')}/${q.get('x')}/${q.get('y')}.png?key=${env.CARTO_KEY ?? env.CATO_KEY}` },
        },
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
