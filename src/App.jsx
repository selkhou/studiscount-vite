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
  const [prestataire, setPrestataire] = useState(null)
  const [enseignes, setEnseignes] = useState([])
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
    // Écouter PASSWORD_RECOVERY EN PREMIER avant tout échange de code
    const { data: { subscription } } = db().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setResetMode(true)
    })

    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const code = params.get('code')
    const typeParam = params.get('type')
    const errorDesc = params.get('error_description') || hashParams.get('error_description')

    if (errorDesc) {
      window.history.replaceState(null, '', window.location.pathname)
      return () => subscription.unsubscribe()
    }

    if (code) {
      // exchangeCodeForSession déclenche onAuthStateChange avec PASSWORD_RECOVERY si c'est un reset
      db().auth.exchangeCodeForSession(code).then(({ data, error }) => {
        // Si ?type=recovery était dans l'URL de redirect, forcer le reset mode
        if (typeParam === 'recovery' && !error && data?.session) {
          setResetMode(true)
        }
        window.history.replaceState(null, '', window.location.pathname)
      })
      return () => subscription.unsubscribe()
    }

    // Fallback hash token (ancien flow Supabase)
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    if ((accessToken && type === 'recovery') || typeParam === 'recovery') {
      db().auth.getSession().then(({ data: { session } }) => {
        if (session) setResetMode(true)
      })
      window.history.replaceState(null, '', window.location.pathname)
    }

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
      onSuccess={(u, enseigne, listeEnseignes) => {
        setUser(u)
        setPrestataire(enseigne || null)
        setEnseignes(listeEnseignes || [])
        setScreen('prestataire-dashboard')
      }}
      onBack={() => setScreenPersist('explorer')}
    />
  )

  if (screen === 'prestataire-select') return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 24px', width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🏪</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0d1a3a', textAlign: 'center', marginBottom: 4 }}>Choisissez votre enseigne</div>
        <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>Plusieurs enseignes sont associées à votre compte</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {enseignes.map(e => (
            <button key={e.id} onClick={() => { setPrestataire(e); setScreen('prestataire-dashboard') }} style={{
              padding: '16px 20px', borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              background: '#fff', textAlign: 'left',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              <div style={{ color: '#0d1a3a', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{e.nom}</div>
              <div style={{ color: '#6B7280', fontSize: 12 }}>SIRET : {e.siret || 'Non renseigné'}</div>
            </button>
          ))}
        </div>
        <button onClick={async () => { await db().auth.signOut(); setUser(null); setPrestataire(null); setEnseignes([]); setScreenPersist('explorer') }}
          style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )

  if (screen === 'prestataire-dashboard') return (
    <PrestataireDashboard
      user={user}
      enseigneInitiale={prestataire}
      onLogout={async () => {
        await db().auth.signOut()
        setUser(null)
        setPrestataire(null)
        setEnseignes([])
        setScreenPersist('explorer')
      }}
      onHome={() => setScreenPersist('explorer')}
      onChangerEnseigne={enseignes.length > 1 ? () => setScreen('prestataire-select') : null}
    />
  )

  return <MapExplorer onConnecte={() => setScreen('auth')} onPrestataire={() => setScreen('prestataire-login')} />
}