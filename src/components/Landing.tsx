import { SignInButton, SignUpButton } from '@clerk/react'
import Footer from './Footer'

const steps = [
  ['Marca el origen', 'Pulsa «Marcar en el mapa», haz clic en cualquier punto de España o busca una dirección.'],
  ['Elige los tiempos', 'De 5 a 60 minutos. Cada tiempo tiene su color y puedes personalizarlo a tu gusto.'],
  ['Calcula y exporta', 'Las áreas de alcance se dibujan sobre el mapa que prefieras y las descargas como PNG.'],
]
const stack = [
  ['React + TypeScript', 'Interfaz'], ['Vite', 'Compilación'], ['Tailwind CSS', 'Estilos'], ['Leaflet', 'Mapas'],
  ['OpenRouteService', 'Isócronas'], ['Clerk', 'Cuentas'], ['Vercel', 'Hosting y funciones'],
]
const links = [
  ['Blog', 'https://aitorsanchez.pages.dev/'], ['Aitor Hub', 'https://aitorhub.vercel.app/'], ['Contacto', 'https://aitorsanchez.pages.dev/contacto'],
]

const btn = 'rounded-lg px-5 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

export default function Landing({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="min-h-full bg-white text-ink">
      {/* Hero */}
      <header className="bg-[#0b1b2e] text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-2xl">Mapa Isocronas</span>
          {signedIn
            ? <a href="#" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10">Abrir la herramienta</a>
            : <SignInButton mode="modal"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10">Iniciar sesión</button></SignInButton>}
        </nav>
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">Hasta dónde llegas conduciendo</h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-slate-300">Elige un punto en España y mira al instante las áreas que alcanzas en 5, 10, 15… hasta 60 minutos al volante.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {signedIn ? <a href="#" className={`${btn} bg-white text-ink hover:bg-slate-100`}>Abrir la herramienta</a> : (<>
              <SignUpButton mode="modal"><button className={`${btn} bg-white text-ink hover:bg-slate-100 focus-visible:ring-white focus-visible:ring-offset-[#0b1b2e]`}>Crear cuenta gratis</button></SignUpButton>
              <SignInButton mode="modal"><button className={`${btn} border border-white/30 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-[#0b1b2e]`}>Iniciar sesión</button></SignInButton></>)}
            </div>
          </div>
          {/* og-image.png (1200×630) completa: sin recortes, centrada, escala por ancho conservando la proporción */}
          <img src="/og-image.png" width={1200} height={630} alt="Mapa de isócronas de conducción alrededor de Vitoria-Gasteiz, con el título Mapa Isocronas"
            className="mx-auto mt-14 h-auto w-full max-w-4xl rounded-3xl shadow-2xl ring-1 ring-white/10" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-24 px-6 py-20">
        {/* Funcionamiento: es una secuencia, de ahí la numeración */}
        <section>
          <h2 className="font-display text-4xl">Cómo funciona</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <article key={t} className="rounded-2xl border border-slate-200 p-6">
                <span className="font-display text-5xl text-route">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-slate-600">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Planes */}
        <section>
          <h2 className="font-display text-4xl">Planes</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 p-8">
              <h3 className="text-lg font-bold">Registrado</h3>
              <p className="mt-2 font-display text-4xl">3 mapas al día</p>
              <p className="mt-3 text-slate-600">Gratis. Todas las capas base, personalización de estilos y exportación a PNG.</p>
            </article>
            <article className="rounded-2xl bg-[#0b1b2e] p-8 text-white">
              <h3 className="text-lg font-bold">Pro</h3>
              <p className="mt-2 font-display text-4xl">Uso ilimitado</p>
              <p className="mt-3 text-slate-300">Sin límite diario de mapas. Pide el acceso Pro a través de la página de contacto.</p>
            </article>
          </div>
        </section>

        {/* Stack */}
        <section>
          <h2 className="font-display text-4xl">Tecnología</h2>
          <ul className="mt-8 flex flex-wrap gap-3">
            {stack.map(([n, r]) => (
              <li key={n} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm"><strong>{n}</strong> <span className="text-slate-500">· {r}</span></li>
            ))}
          </ul>
        </section>

        {/* Autor */}
        <section className="rounded-3xl bg-slate-50 p-8 md:p-12">
          <h2 className="font-display text-4xl">Sobre el autor</h2>
          <p className="mt-4 max-w-2xl text-slate-600">Mapa Isocronas es un proyecto de Aitor Sánchez Gutiérrez. Encuentra más proyectos, artículos y formas de contactar en:</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(([n, u]) => (
              <a key={n} href={u} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:border-route hover:text-route">{n}</a>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
