import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Gestion erreurs globales
window.onerror = function (msg, src, line, col, err) {
  const el = document.getElementById('splash-loader')
  if (el) {
    el.style.opacity = '1'
    el.style.display = 'flex'
    el.style.alignItems = 'flex-start'
    el.style.overflowY = 'auto'
    const srcShort = (src || '').split('/').pop()
    const stack = err && err.stack ? err.stack.substring(0, 300) : ''
    el.innerHTML =
      '<div style="padding:24px;width:100%;max-width:400px;">' +
      '<div style="font-size:36px;text-align:center;margin-bottom:12px;">⚠️</div>' +
      '<div style="color:#0066FF;font-size:15px;font-weight:700;margin-bottom:10px;text-align:center;">Erreur de chargement</div>' +
      '<div style="background:#1C1F23;border:1px solid rgba(0,102,255,0.3);border-radius:10px;padding:12px;margin-bottom:10px;">' +
      '<div style="color:#F7F8F9;font-size:12px;font-weight:600;margin-bottom:4px;">Message :</div>' +
      '<div style="color:#9CA3AF;font-size:11px;word-break:break-all;line-height:1.5;">' + msg + '</div>' +
      '</div>' +
      (srcShort ? '<div style="background:#1C1F23;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:10px;">' +
        '<div style="color:#F7F8F9;font-size:12px;font-weight:600;margin-bottom:4px;">Fichier · Ligne :</div>' +
        '<div style="color:#9CA3AF;font-size:11px;">' + srcShort + ' · ligne ' + line + '</div>' +
        '</div>' : '') +
      (stack ? '<div style="background:#1C1F23;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:10px;">' +
        '<div style="color:#F7F8F9;font-size:12px;font-weight:600;margin-bottom:4px;">Stack :</div>' +
        '<div style="color:#6B7280;font-size:10px;word-break:break-all;line-height:1.5;white-space:pre-wrap;">' + stack + '</div>' +
        '</div>' : '') +
      '<div style="color:#6B7280;font-size:11px;text-align:center;">Copie ce message et envoie-le au support</div>' +
      '</div>'
  }
  return false
}

window.addEventListener('unhandledrejection', function (e) {
  window.onerror('Promise rejetée: ' + (e.reason || e), '', 0, 0,
    e.reason instanceof Error ? e.reason : null)
})

// Démarrage de l'app — on importe App ici
// (les imports async viendront après)
import { loadParams, loadTarifs, loadTypesMetier } from './utils.js'

loadParams()
  .then(() => loadTarifs())
  .then(() => loadTypesMetier())
  .then(() => import('./App.jsx'))
  .then(({ default: App }) => {
    const loader = document.getElementById('splash-loader')
    const root = createRoot(document.getElementById('root'))
    root.render(<App />)
    if (loader) {
      loader.style.transition = 'opacity 0.5s'
      loader.style.opacity = '0'
      setTimeout(() => (loader.style.display = 'none'), 600)
    }

})