import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// FIX #8: Replaced `immediate: true` with a user-prompted update flow.
// `immediate: true` forces the service worker to take control and swap the
// app shell mid-session, which can cause a blank screen or broken asset
// references while the user is entering a transaction.
// The new pattern shows a non-blocking confirm() so the user controls when
// the update applies. onOfflineReady fires silently — no disruption.
registerSW({
  onNeedRefresh() {
    if (confirm('A new version of SiteTracker is available. Reload now to update?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('[SiteTracker] App is ready for offline use.')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
