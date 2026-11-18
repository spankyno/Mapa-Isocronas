# Mapa Isocronas
```bash
npm install
cp .env.example .env   # pon tu ORS_API_KEY
npm run dev
```
Producción: despliega en Vercel (`api/ors.ts` y `api/carto.ts`).

## Cuentas y cuotas (Clerk)
- Variables en Vercel: `ORS_API_KEY`, `CARTO_KEY`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`. Haz redeploy tras añadirlas.
- Registrados: 3 mapas/día (día de Madrid), contados de forma atómica en Redis (Upstash). Sin Redis configurado, las cuentas gratuitas reciben 503.
- Pro: en Clerk Dashboard > Users > usuario > *Public metadata*: `{ "plan": "pro" }`.
- Límites en `api/ors.ts` (servidor): 6 peticiones/min por usuario, 3 mapas/día gratuitos y tope global `GLOBAL_DAILY_LIMIT`.
- En local, `npm run dev` no ejecuta `api/*` (la cuota no se aplica); usa `vercel dev` para probarla.
