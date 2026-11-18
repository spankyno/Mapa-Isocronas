// Utilidades compartidas (el prefijo "_" evita que Vercel las exponga como ruta).
import { verifyToken } from '@clerk/backend'

// Orígenes que pueden emitir sesiones válidas (claim "azp"). Añade dominios propios/previews con ALLOWED_ORIGINS="https://a.com,https://b.com"
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'https://mapaisocronas.vercel.app').split(',').map((s) => s.trim())

/** Devuelve el userId si el token de sesión de Clerk es válido y fue emitido para nuestro origen; si no, null. */
export async function userIdFrom(token: string): Promise<string | null> {
  if (!token) return null
  try {
    const r: any = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY, authorizedParties: ORIGINS })
    if (r?.errors?.length) return null
    return (r?.data ?? r)?.sub ?? null
  } catch { return null }
}

export const bearer = (req: any) => String(req.headers.authorization ?? '').replace(/^Bearer /, '')

/** Tokens de sesión en cookies (__session*): las <img> de teselas no pueden enviar cabecera Authorization. */
export const cookieTokens = (req: any): string[] =>
  String(req.headers.cookie ?? '').split(';').map((s) => s.trim()).filter((s) => s.startsWith('__session'))
    .map((s) => { try { return decodeURIComponent(s.slice(s.indexOf('=') + 1)) } catch { return '' } })

// Redis (Upstash vía REST). Contadores ATÓMICOS: INCR evita la carrera de "leer-comprobar-escribir".
const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
export const hasRedis = Boolean(URL_ && TOKEN)

export async function redis(cmds: (string | number)[][]): Promise<any[]> {
  const r = await fetch(`${URL_}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmds) })
  if (!r.ok) throw new Error('redis')
  return ((await r.json()) as { result: any }[]).map((x) => x.result)
}
