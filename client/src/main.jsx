import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA installability and offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[PWA] Service worker registered:', registration.scope)

      const readyRegistration = await navigator.serviceWorker.ready
      console.log('[PWA] Service worker active:', readyRegistration.active?.state)
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error)
    }
  })
}
