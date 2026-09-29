import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PrototypeShell from './PrototypeShell.jsx'

// Register Service Worker for browser cache and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        console.log('🌱 farm360 Service Worker active. Browser cache enabled.');
      })
      .catch((err) => {
        console.warn('Service worker registration:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrototypeShell />
  </StrictMode>,
)
