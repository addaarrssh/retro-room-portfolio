import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* React 19 routes render errors through these hooks. Without them a component
   that throws inside the R3F canvas disappears silently: the <canvas> element
   is still there, the console is clean, and the scene is simply empty — which
   is indistinguishable from "nothing rendered" and is exactly how a broken
   prop cost hours here. Surfacing them costs nothing. */
const report = (label) => (error, info) => {
  // eslint-disable-next-line no-console
  console.error(`[${label}]`, error?.message ?? error, info?.componentStack ?? '')
  if (typeof window !== 'undefined') {
    window.__reactError = {
      label,
      message: String(error?.message ?? error),
      stack: String(error?.stack ?? ''),
      componentStack: String(info?.componentStack ?? ''),
    }
  }
}

createRoot(document.getElementById('root'), {
  onUncaughtError: report('REACT UNCAUGHT'),
  onCaughtError: report('REACT CAUGHT'),
  onRecoverableError: report('REACT RECOVERABLE'),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
