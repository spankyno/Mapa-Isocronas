import { useEffect } from 'react'
import Markdown from 'react-markdown'
import Footer from './Footer'
import policy from '../content/PoliticaPrivacidad.md?raw'

// Texto de src/content/PoliticaPrivacidad.md (edítalo ahí). Página pública: #privacidad
export default function Privacy() {
  useEffect(() => window.scrollTo(0, 0), [])
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <div className="flex-1 px-5 py-10">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm md:p-10">
        <a href="#" className="text-sm font-semibold text-route hover:underline">← Volver a Mapa Isocronas</a>
        <div className="mt-6">
          <Markdown components={{
            h3: (p) => <h3 className="mb-2 mt-8 text-lg font-bold" {...p} />,
            p: (p) => <p className="my-3 leading-relaxed text-slate-700" {...p} />,
            ul: (p) => <ul className="my-3 list-disc space-y-1 pl-6 text-slate-700" {...p} />,
            a: (p) => <a className="font-medium text-route underline" target="_blank" rel="noopener noreferrer" {...p} />,
            code: (p) => <code className="rounded bg-slate-100 px-1 text-sm" {...p} />,
          }}>{policy}</Markdown>
        </div>
      </article>
      </div>
      <Footer />
    </div>
  )
}
