import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Service Worker Update Flow
// Ensures the app shell stays fresh without interrupting active transactions.
registerSW({
  onNeedRefresh() {
    if (confirm('New SiteTracker update available. Reload to apply?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('[SiteTracker] Ready for foolproof offline use.')
  },
})

// Your Google Client ID from the Cloud Console
const GOOGLE_CLIENT_ID = "537010194195-emq48ik6km3m0gnv746t05mscj49ahrh.apps.googleusercontent.com"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)