# Mapa Isocronas
```bash
npm install
cp .env.example .env   # pon tu ORS_API_KEY
npm run dev
```
Producción: despliega en Vercel (usa `api/ors.ts`) o publica `worker/ors-worker.js` en Cloudflare y define `VITE_ORS_PROXY_URL`.

## Cuentas y cuotas (Clerk)
- Variables en Vercel: `ORS_API_KEY`, `CARTO_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`. Haz redeploy tras añadirlas.
- Registrados: 3 mapas/día (día de Madrid). Cada cálculo correcto cuenta como un mapa.
- Pro: en Clerk Dashboard > Users > usuario > *Public metadata*: `{ "plan": "pro" }`.
- Cuota y plan se comprueban en `api/ors.ts` (servidor). El proxy de Cloudflare no implementa auth: usa Vercel.
- En local, `npm run dev` no ejecuta `api/*` (la cuota no se aplica); usa `vercel dev` para probarla.
