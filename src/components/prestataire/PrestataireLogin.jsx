import { useState } from 'react'
import { getC } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { PrestPageShell } from '../ui/PageShells.jsx'
import FInput from '../ui/FInput.jsx'
import Btn from '../ui/Btn.jsx'
import PrestataireRegister from './PrestataireRegister.jsx'

export default function PrestataireLogin({ onSuccess, onBack }) {
  const C = getC()
  const [subScreen, setSubScreen] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  const login = async () => {
    setError(''); setLoading(true)
    try {
      const { data, error: err } = await db().auth.signInWithPassword({
        email: form.email, password: form.password
      })
      if (err) throw err
      onSuccess(data.user)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const sendReset = async () => {
    setResetError('')
    if (!resetEmail.trim()) { setResetError('Saisis ton email'); return }
    setResetLoading(true)
    try {
      // Vérifier que le prestataire existe
      const { data: presta } = await db().from('prestataires').select('id').eq('email', resetEmail.trim()).maybeSingle()
      if (!presta) { setResetError('Aucun compte prestataire trouvé avec cet email'); setResetLoading(false); return }
      const { error: err } = await db().auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: window.location.origin })
      if (err) throw err
      setResetSent(true)
    } catch (e) { setResetError(e.message) }
    setResetLoading(false)
  }

  if (subScreen === 'register') return (
    <PrestataireRegister onSuccess={onSuccess} onBack={() => setSubScreen('login')} />
  )

  if (subScreen === 'forgot') return (
    <PrestPageShell onBack={() => { setSubScreen('login'); setResetSent(false); setResetError('') }} backLabel="Connexion">
      <div style={{ padding: '32px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>🔑</div>
        <div style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
          Mot de passe oublié
        </div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 28, textAlign: 'center' }}>
          Entrez votre email pour recevoir un lien de réinitialisation
        </div>
        {!resetSent ? (
          <>
            <FInput label="Email" type="email" value={resetEmail}
              onChange={v => setResetEmail(v)}
              placeholder="votre@email.com" required />
            {resetError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>
                ⚠️ {resetError}
              </div>
            )}
            <Btn onClick={sendReset} disabled={!resetEmail.trim()} loading={resetLoading}>
              Envoyer le lien de réinitialisation
            </Btn>
          </>
        ) : (
          <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
            <div style={{ color: '#22C55E', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Email envoyé !</div>
            <div style={{ color: C.muted, fontSize: 13 }}>Vérifiez votre boîte mail et cliquez sur le lien.</div>
          </div>
        )}
      </div>
    </PrestPageShell>
  )

  return (
    <PrestPageShell onBack={onBack} backLabel="Accueil">
      <div style={{ padding: '32px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>🏪</div>
        <div style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
          Espace prestataire
        </div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 28, textAlign: 'center' }}>
          Gérez vos offres étudiantes
        </div>
        <FInput label="Email" type="email" value={form.email}
          onChange={v => setForm(f => ({ ...f, email: v }))}
          placeholder="votre@email.com" required />
        <FInput label="Mot de passe" type="password" value={form.password}
          onChange={v => setForm(f => ({ ...f, password: v }))}
          placeholder="••••••••" required />
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        <Btn onClick={login} disabled={!form.email || !form.password} loading={loading}>
          Se connecter
        </Btn>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={() => { setSubScreen('forgot'); setResetEmail(form.email); setResetError('') }}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            Mot de passe oublié ?
          </button>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 10 }}>Pas encore de compte ?</div>
          <button onClick={() => setSubScreen('register')} style={{
            padding: '12px 24px', borderRadius: 12,
            border: '1px solid rgba(0,102,255,0.4)',
            background: 'rgba(0,102,255,0.08)', color: '#0066FF',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Créer mon compte prestataire →
          </button>
        </div>
      </div>
    </PrestPageShell>
  )
}
