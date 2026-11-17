import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { esES } from '@clerk/localizations'
import App from './App'
import './index.css'

// La clave publicable de Clerk es pública por diseño (la secreta CLERK_SECRET_KEY solo vive en el servidor).
const key = (import.meta.env.CLERK_PUBLISHABLE_KEY ?? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) as string | undefined

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {key ? <ClerkProvider publishableKey={key} localization={esES}><App /></ClerkProvider>
      : <p className="p-6">Falta CLERK_PUBLISHABLE_KEY en las variables de entorno.</p>}
  </React.StrictMode>,
)
