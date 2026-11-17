// Proxy de teselas CARTO: la clave (CARTO_KEY, o CATO_KEY si así la nombraste) nunca llega al navegador.
export default async function handler(req: any, res: any) {
  const key = process.env.CARTO_KEY ?? process.env.CATO_KEY
  const { z, x, y } = req.query
  if (!key) return res.status(500).send('Falta CARTO_KEY')
  if (![z, x, y].every((v) => /^\d{1,7}$/.test(String(v)))) return res.status(400).send('bad tile')
  const r = await fetch(`https://basemaps.cartocdn.com/rastertiles/light_all/${z}/${x}/${y}.png?key=${key}`)
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800') // la CDN de Vercel cachea teselas
  res.status(r.status).send(Buffer.from(await r.arrayBuffer()))
}
