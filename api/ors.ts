// Vercel Function: sesión Clerk → límites (atómicos, en Redis) → ORS.
// Códigos: 401 sesión · 429 cuota diaria / demasiadas peticiones · 502 clave ORS inválida · 503 ORS saturado, capacidad o cuotas no configuradas
//          422 ORS no pudo calcular · 504 ORS lento · 500 fallo del servidor.
import { createClerkClient } from '@clerk/backend'
import { bearer, hasRedis, redis, userIdFrom } from './_auth.js'

const FREE_LIMIT = 3                                            // mapas/día, cuentas gratuitas
const RATE_LIMIT = 6                                            // peticiones/minuto por usuario (también Pro)
const GLOBAL_LIMIT = Number(process.env.GLOBAL_DAILY_LIMIT ?? 400) // tope diario de la clave ORS para cuentas gratuitas
const PROFILES = ['driving-car', 'driving-hgv', 'cycling-regular', 'foot-walking']
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // día de España
const short = (s: unknown) => String(s ?? '').slice(0, 200)

// Fallos transitorios de la pasarela de ORS. Un 500 con código propio de ORS (p. ej. 3099) es determinista y no se reintenta.
const transient = (status: number, text: string) => status >= 502 || /problem proxying/i.test(text)

async function callOrs(profile: string, body: unknown) {
  for (let i = 0; i < 3; i++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 18000)
    try {
      const r = await fetch(`https://api.openrouteservice.org/v2/isochrones/${profile}`, {
        method: 'POST', signal: ctrl.signal,
        headers: { Authorization: process.env.ORS_API_KEY ?? '', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await r.text()
      if (!transient(r.status, text) || i === 2) return { r, text }
    } catch (e) { if (i === 2) throw e } finally { clearTimeout(timer) }
    await new Promise((ok) => setTimeout(ok, 1500))
  }
  throw new Error('unreachable')
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  let undo = async () => {} // devuelve la cuota reservada si el cálculo no llega a buen puerto
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method' })
    const userId = await userIdFrom(bearer(req))
    if (!userId) return res.status(401).json({ error: 'unauthenticated' })

    const pro = (await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUser(userId)).publicMetadata?.plan === 'pro'
    if (!pro && !hasRedis) return res.status(503).json({ error: 'quota_unavailable' }) // sin contador atómico no se sirven cuentas gratuitas

    const day = today(), qK = `q:${userId}:${day}`, gK = `g:${day}`, rK = `rl:${userId}:${Math.floor(Date.now() / 60000)}`

    if (req.method === 'GET') { // consulta sin consumir
      if (pro) return res.status(200).json({ remaining: 'unlimited' })
      const [n] = await redis([['GET', qK]])
      return res.status(200).json({ remaining: String(Math.max(0, FREE_LIMIT - Number(n ?? 0))) })
    }

    // 1) Validar entrada ANTES de reservar cuota. Solo se reenvían campos permitidos, con coordenadas dentro de España.
    const b = req.body, loc = b?.locations?.[0]
    const valid = Array.isArray(b?.locations) && b.locations.length === 1 && Array.isArray(loc) && loc.length === 2 &&
      loc.every((v: unknown) => typeof v === 'number' && Number.isFinite(v)) && loc[0] >= -19 && loc[0] <= 5 && loc[1] >= 27 && loc[1] <= 44 &&
      Array.isArray(b?.range) && b.range.length >= 1 && b.range.length <= 7 &&
      b.range.every((n: unknown) => Number.isInteger(n) && (n as number) > 0 && (n as number) <= 3600)
    if (!valid) return res.status(400).json({ error: 'bad_request' })
    const profile = String(req.query?.profile ?? 'driving-car')
    if (!PROFILES.includes(profile)) return res.status(400).json({ error: 'bad_profile' })

    // 2) Reservar de forma atómica: límite por minuto (todos), por día (gratuitos) y tope global diario (gratuitos).
    let q = 0
    if (hasRedis) {
      const cmds: (string | number)[][] = [['INCR', rK], ['EXPIRE', rK, 120]]
      if (!pro) cmds.push(['INCR', qK], ['EXPIRE', qK, 172800], ['INCR', gK], ['EXPIRE', gK, 172800])
      const r = await redis(cmds)
      q = r[2]
      undo = async () => { if (!pro) await redis([['DECR', qK], ['DECR', gK]]).catch(() => {}) }
      if (r[0] > RATE_LIMIT) { await undo(); return res.status(429).json({ error: 'rate_limited' }) }
      if (!pro && q > FREE_LIMIT) { await undo(); res.setHeader('X-Remaining', '0'); return res.status(429).json({ error: 'daily_limit' }) }
      if (!pro && r[4] > GLOBAL_LIMIT) { await undo(); return res.status(503).json({ error: 'capacity' }) }
    }

    // 3) Llamar a ORS
    let out: Awaited<ReturnType<typeof callOrs>>
    try { out = await callOrs(profile, { locations: [[loc[0], loc[1]]], range: b.range, range_type: 'time', attributes: ['area'], smoothing: 0.8 }) }
    catch (e) { console.error('ORS timeout/red', e); await undo(); return res.status(504).json({ error: 'ors_timeout' }) }
    const { r, text } = out
    if (!r.ok) {
      await undo()
      console.error('ORS error', r.status, profile, text.slice(0, 500)) // visible en Vercel > Logs
      if (transient(r.status, text)) return res.status(504).json({ error: 'ors_timeout' })
      if (r.status === 401 || r.status === 403) return res.status(502).json({ error: 'ors_key' })
      if (r.status === 429) return res.status(503).json({ error: 'ors_busy' })
      let detail = text
      try { const j = JSON.parse(text); detail = j?.error?.message ?? j?.error ?? text } catch { /* texto plano */ }
      if (/^\s*</.test(String(detail))) detail = 'respuesta no válida de ORS'
      return res.status(422).json({ error: 'ors_error', status: r.status, detail: short(typeof detail === 'string' ? detail : JSON.stringify(detail)) })
    }

    res.setHeader('X-Remaining', pro ? 'unlimited' : String(Math.max(0, FREE_LIMIT - q)))
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send(text)
  } catch (e) {
    await undo()
    console.error('Fallo en /api/ors', e) // el detalle solo va a los logs, no al cliente
    if (e instanceof Error && e.message === 'redis') return res.status(503).json({ error: 'quota_unavailable' }) // Redis mal configurado o caído
    return res.status(500).json({ error: 'server' })
  }
}
