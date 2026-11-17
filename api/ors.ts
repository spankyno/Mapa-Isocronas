// Vercel Serverless Function: POST /api/ors → ORS (la clave vive en ORS_API_KEY, solo servidor)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const r = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
    method: 'POST',
    headers: { Authorization: process.env.ORS_API_KEY ?? '', 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text())
}
