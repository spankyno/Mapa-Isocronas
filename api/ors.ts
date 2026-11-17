// Vercel Function: valida sesión de Clerk, aplica cuota diaria y reenvía a ORS.
// Cuota en Clerk (privateMetadata.usage). Plan Pro: publicMetadata.plan === "pro".
// Códigos: 401 sesión · 429 cuota diaria · 502 clave ORS inválida · 503 ORS saturado ·
//          422 ORS no pudo calcular (con detalle) · 500 fallo del servidor (con detalle).
import { createClerkClient, verifyToken } from '@clerk/backend'

const FREE_LIMIT = 3
const PROFILES = ['driving-car', 'driving-hgv', 'cycling-regular', 'foot-walking']
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // día de España
const short = (s: unknown) => String(s ?? '').slice(0, 200)

export default async function handler(req: any, res: any) {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY
    const token = String(req.headers.authorization ?? '').replace(/^Bearer /, '')
    let userId: string
    try {
      const r: any = await verifyToken(token, { secretKey })
      if (r?.errors?.length) throw r.errors[0]
      userId = (r?.data ?? r).sub
      if (!userId) throw new Error('no sub')
    } catch { return res.status(401).json({ error: 'unauthenticated' }) }

    const clerk = createClerkClient({ secretKey })
    const user = await clerk.users.getUser(userId)
    const pro = user.publicMetadata?.plan === 'pro'
    const usage = user.privateMetadata?.usage as { date: string; count: number } | undefined
    const used = usage?.date === today() ? usage.count : 0
    const left = (n: number) => (pro ? 'unlimited' : String(Math.max(0, FREE_LIMIT - n)))

    if (req.method === 'GET') return res.status(200).json({ remaining: left(used) }) // consulta sin consumir
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
    if (!pro && used >= FREE_LIMIT) { res.setHeader('X-Remaining', '0'); return res.status(429).json({ error: 'daily_limit' }) }

    // Validamos y reenviamos solo campos permitidos (evita usos arbitrarios de la API)
    const b = req.body
    const valid = Array.isArray(b?.locations) && b.locations.length === 1 && Array.isArray(b?.range) && b.range.length >= 1 &&
      b.range.length <= 7 && b.range.every((n: number) => Number.isFinite(n) && n > 0 && n <= 3600)
    if (!valid) return res.status(400).json({ error: 'bad_request' })

    const profile = String(req.query?.profile ?? 'driving-car')
    if (!PROFILES.includes(profile)) return res.status(400).json({ error: 'bad_profile' })

    const r = await fetch(`https://api.openrouteservice.org/v2/isochrones/${profile}`, {
      method: 'POST',
      headers: { Authorization: process.env.ORS_API_KEY ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: b.locations, range: b.range, range_type: 'time', attributes: ['area'], smoothing: 0.8 }),
    })
    const text = await r.text()
    if (!r.ok) {
      console.error('ORS error', r.status, profile, text.slice(0, 500)) // visible en Vercel > Logs
      if (r.status === 401 || r.status === 403) return res.status(502).json({ error: 'ors_key' })
      if (r.status === 429) return res.status(503).json({ error: 'ors_busy' })
      let detail = text
      try { const j = JSON.parse(text); detail = j?.error?.message ?? j?.error ?? text } catch { /* texto plano */ }
      return res.status(422).json({ error: 'ors_error', status: r.status, detail: short(typeof detail === 'string' ? detail : JSON.stringify(detail)) })
    }

    // Solo se consume cuota si el cálculo fue correcto (un fallo al guardarla no pierde el resultado)
    if (!pro) {
      try { await clerk.users.updateUserMetadata(userId, { privateMetadata: { usage: { date: today(), count: used + 1 } } }) }
      catch (e) { console.error('No se pudo guardar la cuota', e) }
    }
    res.setHeader('X-Remaining', left(used + 1))
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send(text)
  } catch (e) {
    console.error('Fallo en /api/ors', e)
    return res.status(500).json({ error: 'server', detail: short(e instanceof Error ? e.message : e) })
  }
}
