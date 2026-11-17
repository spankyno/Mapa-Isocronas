// Cloudflare Worker. Secreto:  wrangler secret put ORS_API_KEY
// Cambia ALLOWED_ORIGIN por tu dominio y define VITE_ORS_PROXY_URL con la URL del Worker.
const ALLOWED_ORIGIN = '*'
const cors = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })
    const r = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
      method: 'POST',
      headers: { Authorization: env.ORS_API_KEY, 'Content-Type': 'application/json' },
      body: await request.text(),
    })
    return new Response(await r.text(), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } })
  },
}
