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
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin() {
    setError('')
    if (!email || !pwd) { setError('Remplis tous les champs'); return }
    setLoading(true)
    try {
      const { data, error: e } = await db().auth.signInWithPassword({ email, password: pwd })
      if (e) { setError(e.message); setLoading(false); return }
      await db().auth.getSession()
      const { data: et } = await db().from('etudiants').select('*').eq('auth_id', data.user.id).single()
      if (et) { setLoading(false); onSuccess(et) }
      else { setError('Compte étudiant introuvable'); setLoading(false) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleReset() {
    setError('')
    if (!email) { setError('Saisis ton email'); return }
    // Vérifier que l'étudiant existe
    setResetLoading(true)
    try {
      const { data: et } = await db().from('etudiants').select('id').eq('email', email).maybeSingle()
      if (!et) { setError('Aucun compte trouvé avec cet email'); setResetLoading(false); return }
      const { error: e } = await db().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (e) throw e
      setResetSent(true)
    } catch (e) { setError(e.message) }
    setResetLoading(false)
  }

  if (forgotMode) return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: CS.text, marginBottom: 4 }}>Mot de passe oublié</div>
        <div style={{ fontSize: 14, color: CS.muted }}>Saisis ton email pour recevoir un lien de réinitialisation</div>
      </div>
      {!resetSent ? (
        <>
          <StudentFInput label="Email" type="email" value={email} onChange={setEmail} placeholder="ton@email.com" required />
          {error && <div style={{ color: CS.red, fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
          <StudentBtn onClick={handleReset} loading={resetLoading}>Envoyer le lien</StudentBtn>
        </>
      ) : (
        <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📧</div>
          <div style={{ color: '#22C55E', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Email envoyé !</div>
          <div style={{ color: CS.muted, fontSize: 13 }}>Vérifie ta boîte mail et clique sur le lien.</div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => { setForgotMode(false); setResetSent(false); setError('') }} style={{ background: 'none', border: 'none', color: CS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Retour à la connexion
        </button>
      </div>
    </div>
  )

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

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button onClick={() => { setForgotMode(true); setError('') }} style={{
          background: 'none', border: 'none', color: CS.muted,
          fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline'
        }}>
          Mot de passe oublié ?
        </button>
      </div>

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
  const [otpData, setOtpData] = useState(null) // { email, prenom, authId }

  async function handleRegister() {
    setError('')
    if (!email || !prenom || !pwd) { setError('Remplis tous les champs'); return }
    if (pwd.length < 8) { setError('Mot de passe : 8 caractères minimum'); return }
    if (pwd !== pwd2) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const { data, error: e } = await db().auth.signUp({ email, password: pwd })
      if (e) { setError(e.message); setLoading(false); return }
      setOtpData({ email, prenom, authId: data.user?.id })
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (otpData) {
    return (
    <EtudiantOTP
      email={otpData.email}
      prenom={otpData.prenom}
      authId={otpData.authId}
      onSuccess={onSuccess}
      onBack={() => setOtpData(null)}
    />
  )
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

function EtudiantOTP({ email, prenom, authId, onSuccess, onBack }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  async function handleVerify() {
    setError('')
    if (code.length < 6) { setError('Saisis le code à 6 chiffres reçu par email'); return }
    setLoading(true)
    try {
      const { error: e } = await db().auth.verifyOtp({ email, token: code, type: 'signup' })
      if (e) { setError(e.message); setLoading(false); return }

      // OTP validé — on crée maintenant l'étudiant en base
      const { data: et, error: e2 } = await db()
        .from('etudiants')
        .insert({
          auth_id: authId,
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

  async function handleResend() {
    setError('')
    try {
      await db().auth.resend({ email, type: 'signup' })
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: CS.text, marginBottom: 4 }}>
          Vérifie ton email
        </div>
        <div style={{ fontSize: 14, color: CS.muted, lineHeight: 1.6 }}>
          Un code de vérification a été envoyé à<br />
          <span style={{ color: CS.accent, fontWeight: 700 }}>{email}</span>
        </div>
      </div>

      <StudentFInput
        label="Code de vérification"
        type="number"
        value={code}
        onChange={v => setCode(v.slice(0, 6))}
        placeholder="123456"
        required
      />

      {error && (
        <div style={{ color: CS.red, fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>
          {error}
        </div>
      )}
      {resent && (
        <div style={{ color: '#22C55E', fontSize: 13, marginBottom: 12, background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: 8 }}>
          ✅ Code renvoyé !
        </div>
      )}

      <StudentBtn onClick={handleVerify} loading={loading}>
        Valider mon compte
      </StudentBtn>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={handleResend} style={{ background: 'none', border: 'none', color: CS.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
          Renvoyer le code
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: CS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Modifier mon email
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