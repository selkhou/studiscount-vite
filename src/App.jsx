import { useState, useEffect } from 'react'
import { db } from './lib/supabase.js'
import MapExplorer from './components/map/MapExplorer.jsx'
import EtudiantDashboard from './components/etudiant/EtudiantDashboard.jsx'
import EtudiantApp from './components/etudiant/EtudiantApp.jsx'
import PrestataireLogin from './components/prestataire/PrestataireLogin.jsx'
import PrestataireDashboard from './components/prestataire/PrestataireDashboard.jsx'
import ChangePassword from './components/ui/ChangePassword.jsx'
import { CS } from './constants.js'

export default function App() {
  const savedEt = (() => {
    try { const s = localStorage.getItem('stu10_etudiant'); return s ? JSON.parse(s) : null }
    catch (e) { return null }
  })()
  const savedScreen = (() => {
    try { return localStorage.getItem('stu10_screen') || 'explorer' }
    catch (e) { return 'explorer' }
  })()

  const [screen, setScreen] = useState(savedEt ? savedScreen : 'explorer')
  const [user, setUser] = useState(null)
  const [etudiant, setEtudiant] = useState(savedEt)
  const [resetMode, setResetMode] = useState(false)

  const setEtudiantPersist = (et) => {
    setEtudiant(et)
    try {
      if (et) localStorage.setItem('stu10_etudiant', JSON.stringify(et))
      else { localStorage.removeItem('stu10_etudiant'); localStorage.removeItem('stu10_screen') }
    } catch (e) { }
  }

  const setScreenPersist = (s) => {
    setScreen(s)
    try { localStorage.setItem('stu10_screen', s) } catch (e) { }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const code = params.get('code')
    const type = params.get('type') || hashParams.get('type')
    const errorDesc = params.get('error_description') || hashParams.get('error_description')

    if (errorDesc) {
      console.warn('Auth error:', errorDesc)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    if (code) {
      db().auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data?.session) setResetMode(true)
        window.history.replaceState(null, '', window.location.pathname)
      })
      return
    }

    if (type === 'recovery' || hashParams.get('access_token')) {
      db().auth.getSession().then(({ data: { session } }) => {
        if (session) setResetMode(true)
      })
      window.history.replaceState(null, '', window.location.pathname)
    }

    const { data: { subscription } } = db().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setResetMode(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Reset mot de passe
  if (resetMode) return (
    <div style={{ minHeight: '100vh', background: CS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
        <div style={{ color: CS.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Nouveau mot de passe</div>
        <div style={{ color: CS.muted, fontSize: 13, marginBottom: 20 }}>Choisissez votre nouveau mot de passe</div>
        <ChangePassword onClose={async () => {
          await db().auth.signOut()
          setResetMode(false)
          setScreen('auth')
          window.location.hash = ''
        }} />
      </div>
    </div>
  )

  if (screen === 'explorer') return (
    <MapExplorer
      onConnecte={(et) => {
        if (et) {
          setEtudiant(et)
          setScreen('etudiant-app')
          try {
            localStorage.setItem('stu10_etudiant', JSON.stringify(et))
            localStorage.setItem('stu10_screen', 'etudiant-app')
          } catch (ex) { }
        } else {
          setScreen('auth')
        }
      }}
      onPrestataire={() => setScreen('prestataire-login')}
    />
  )

  if (screen === 'auth') return (
    <EtudiantDashboard
      onBack={() => setScreenPersist('explorer')}
      onConnecte={(e) => {
        console.log('onConnecte appelé', e?.prenom)
        setEtudiant(e)
        setScreen('etudiant-app')
        try {
          localStorage.setItem('stu10_etudiant', JSON.stringify(e))
          localStorage.setItem('stu10_screen', 'etudiant-app')
        } catch (ex) { }
      }}
    />
  )

  if (screen === 'etudiant-app') return (
    <EtudiantApp
      etudiant={etudiant}
      onLogout={() => { setEtudiantPersist(null); setScreenPersist('explorer') }}
      onHome={() => setScreenPersist('etudiant-app')}
    />
  )

  if (screen === 'prestataire-login') return (
    <PrestataireLogin
      onSuccess={(u) => { setUser(u); setScreen('prestataire-dashboard') }}
      onBack={() => setScreenPersist('explorer')}
    />
  )

  if (screen === 'prestataire-dashboard') return (
    <PrestataireDashboard
      user={user}
      onLogout={() => { setUser(null); setScreenPersist('explorer') }}
      onHome={() => setScreenPersist('explorer')}
    />
  )

  return <MapExplorer onConnecte={() => setScreen('auth')} onPrestataire={() => setScreen('prestataire-login')} />
}