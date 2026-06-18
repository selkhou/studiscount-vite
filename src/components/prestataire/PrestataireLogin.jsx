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

  if (subScreen === 'register') return (
    <PrestataireRegister onSuccess={onSuccess} onBack={() => setSubScreen('login')} />
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
          <div style={{
            background: 'rgba(239,68,68,0.1)', borderRadius: 10,
            padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: 13
          }}>⚠️ {error}</div>
        )}
        <Btn onClick={login} disabled={!form.email || !form.password} loading={loading}>
          Se connecter
        </Btn>
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