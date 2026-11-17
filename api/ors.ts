// Vercel Function: valida sesión de Clerk, aplica cuota diaria y reenvía a ORS.
// Cuota en Clerk (privateMetadata.usage). Plan Pro: publicMetadata.plan === "pro".
import { createClerkClient, verifyToken } from '@clerk/backend'

const FREE_LIMIT = 3
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // día de España

export default async function handler(req: any, res: any) {
  const secretKey = process.env.CLERK_SECRET_KEY
  const token = String(req.headers.authorization ?? '').replace(/^Bearer /, '')
  let userId: string
  try { userId = (await verifyToken(token, { secretKey })).sub } catch { return res.status(401).json({ error: 'unauthenticated' }) }

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

  const r = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
    method: 'POST',
    headers: { Authorization: process.env.ORS_API_KEY ?? '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations: b.locations, range: b.range, range_type: 'time', attributes: ['area'], smoothing: 0.8 }),
  })
  // Errores de ORS no se confunden con los de sesión/cuota
  if (!r.ok) return res.status(r.status === 401 || r.status === 403 ? 502 : r.status === 429 ? 503 : r.status).json({ error: 'ors' })

  // Solo se consume cuota si el cálculo fue correcto
  if (!pro) await clerk.users.updateUserMetadata(userId, { privateMetadata: { usage: { date: today(), count: used + 1 } } })
  res.setHeader('X-Remaining', left(used + 1))
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(await r.text())
}
