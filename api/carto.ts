// Proxy de teselas CARTO. La clave (CARTO_KEY, o CATO_KEY) nunca llega al navegador y solo sirve a usuarios con sesión.
import { cookieTokens, userIdFrom } from './_auth'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).send('method')
  const site = req.headers['sec-fetch-site'] // evita hotlinking desde otras webs
  if (site && site !== 'same-origin') return res.status(403).send('forbidden')

  let ok = false
  for (const t of cookieTokens(req)) if (await userIdFrom(t)) { ok = true; break }
  if (!ok) return res.status(401).send('unauthenticated')

  const key = process.env.CARTO_KEY ?? process.env.CATO_KEY
  if (!key) return res.status(500).send('config')
  const z = Number(req.query.z), x = Number(req.query.x), y = Number(req.query.y)
  if (![z, x, y].every(Number.isInteger) || z < 4 || z > 19 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return res.status(400).send('bad tile')

  const r = await fetch(`https://basemaps.cartocdn.com/rastertiles/light_all/${z}/${x}/${y}.png?key=${key}`)
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'private, max-age=86400') // solo caché del navegador: la CDN pública serviría teselas sin comprobar sesión
  res.status(r.status).send(Buffer.from(await r.arrayBuffer()))
}
