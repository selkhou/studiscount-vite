import { useState } from 'react'
import { CS } from '../../constants.js'
import { db } from '../../lib/supabase.js'
import StudentFInput from './StudentFInput.jsx'
import StudentBtn from './StudentBtn.jsx'

export default function ChangePassword({ onClose }) {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError('')
    if (pwd.length < 8) { setError('8 caractères minimum'); return }
    if (pwd !== pwd2) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const { error: e } = await db().auth.updateUser({ password: pwd })
      if (e) { setError(e.message); return }
      setDone(true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ color: CS.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        Mot de passe modifié
      </div>
      <StudentBtn onClick={onClose}>Continuer</StudentBtn>
    </div>
  )

  return (
    <div>
      <StudentFInput
        label="Nouveau mot de passe"
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
      <StudentBtn onClick={handleSubmit} loading={loading}>
        Changer le mot de passe
      </StudentBtn>
    </div>
  )
}