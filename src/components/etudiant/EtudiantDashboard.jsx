import { useState } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import { StudentPageShell } from '../ui/PageShells.jsx'
import StudentBtn from '../ui/StudentBtn.jsx'
import StudentFInput from '../ui/StudentFInput.jsx'
import SIOKLogo from '../ui/SIOKLogo.jsx'

function EtudiantLogin({ onSuccess, onRegister, onBack }) {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    if (!email || !pwd) { setError('Remplis tous les champs'); return }
    setLoading(true)
    try {
      const { data, error: e } = await db().auth.signInWithPassword({ email, password: pwd })
      if (e) { setError(e.message); setLoading(false); return }

      // Attendre que la session soit propagée
      await db().auth.getSession()

      const { data: et } = await db()
        .from('etudiants')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (et) {
        setLoading(false)
        onSuccess(et)
      } else {
        setError('Compte étudiant introuvable')
        setLoading(false)
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: CS.text, marginBottom: 4 }}>
          Espace étudiant
        </div>
        <div style={{ fontSize: 14, color: CS.muted }}>
          Connecte-toi pour profiter des offres
        </div>
      </div>

      <StudentFInput
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="ton@email.com"
        required
      />
      <StudentFInput
        label="Mot de passe"
        type="password"
        value={pwd}
        onChange={setPwd}
        placeholder="Ton mot de passe"
        required
      />

      {error && (
        <div style={{
          color: CS.red, fontSize: 13, marginBottom: 12,
          background: 'rgba(239,68,68,0.08)',
          padding: '8px 12px', borderRadius: 8
        }}>
          {error}
        </div>
      )}

      <StudentBtn onClick={handleLogin} loading={loading}>
        Se connecter
      </StudentBtn>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={onRegister} style={{
          background: 'none', border: 'none',
          color: CS.accent, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Pas encore de compte ? S'inscrire
        </button>
      </div>
    </div>
  )
}

function EtudiantRegister({ onSuccess, onBack }) {
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    setError('')
    if (!email || !prenom || !pwd) { setError('Remplis tous les champs'); return }
    if (pwd.length < 8) { setError('Mot de passe : 8 caractères minimum'); return }
    if (pwd !== pwd2) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const { data, error: e } = await db().auth.signUp({ email, password: pwd })
      if (e) { setError(e.message); setLoading(false); return }

      const { data: et, error: e2 } = await db()
        .from('etudiants')
        .insert({
          auth_id: data.user?.id,
          email,
          prenom,
          statut_validation: 'en_attente',
          points: 0,
        })
        .select()
        .single()

      if (e2) { setError(e2.message); setLoading(false); return }
      onSuccess(et)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: CS.text, marginBottom: 4 }}>
          Créer un compte
        </div>
        <div style={{ fontSize: 14, color: CS.muted }}>
          Rejoins la communauté StuDiscount
        </div>
      </div>

      <StudentFInput
        label="Prénom"
        value={prenom}
        onChange={setPrenom}
        placeholder="Ton prénom"
        required
      />
      <StudentFInput
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="ton@email.com"
        required
      />
      <StudentFInput
        label="Mot de passe"
        type="password"
        value={pwd}
        onChange={setPwd}
        placeholder="8 caractères minimum"
        required
      />
      <StudentFInput
        label="Confirmer le mot de passe"
        type="password"
        value={pwd2}
        onChange={setPwd2}
        placeholder="Répète le mot de passe"
        required
      />

      {error && (
        <div style={{
          color: CS.red, fontSize: 13, marginBottom: 12,
          background: 'rgba(239,68,68,0.08)',
          padding: '8px 12px', borderRadius: 8
        }}>
          {error}
        </div>
      )}

      <StudentBtn onClick={handleRegister} loading={loading}>
        Créer mon compte
      </StudentBtn>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none',
          color: CS.accent, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Déjà un compte ? Se connecter
        </button>
      </div>
    </div>
  )
}

export default function EtudiantDashboard({ onBack, onConnecte }) {
  const [vue, setVue] = useState('login')

  return (
    <StudentPageShell onBack={onBack} backLabel="Retour">
      {vue === 'login' && (
        <EtudiantLogin
          onSuccess={onConnecte}
          onRegister={() => setVue('register')}
          onBack={onBack}
        />
      )}
      {vue === 'register' && (
        <EtudiantRegister
          onSuccess={onConnecte}
          onBack={() => setVue('login')}
        />
      )}
    </StudentPageShell>
  )
}