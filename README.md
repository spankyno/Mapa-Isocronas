# Mapa Isocronas
```bash
npm install
cp .env.example .env   # pon tu ORS_API_KEY
npm run dev
```
Producción: despliega en Vercel (usa `api/ors.ts`) o publica `worker/ors-worker.js` en Cloudflare y define `VITE_ORS_PROXY_URL`.
