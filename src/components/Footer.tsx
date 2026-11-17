// Pie de página común (herramienta, "Acerca de" y política de privacidad)
const links: [string, string, boolean][] = [
  ['Acerca de', '#acerca', false],
  ['Política de privacidad', '#privacidad', false],
  ['Blog', 'https://aitorsanchez.pages.dev/', true],
  ['Contacto', 'https://aitorsanchez.pages.dev/contacto', true],
  ['Más apps', 'https://aitorhub.vercel.app/', true],
]

export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1.5 md:flex-row">
        <p>Autor: Aitor Sánchez Gutiérrez. © 2026 - Todos los derechos reservados.</p>
        <nav aria-label="Enlaces del sitio">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {links.map(([name, href, external]) => (
              <li key={name}>
                <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="font-medium hover:text-route hover:underline">{name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
