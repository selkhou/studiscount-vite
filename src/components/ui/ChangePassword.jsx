import { useState } from 'react'
import { db } from '../../lib/supabase.js'

export default function ChangePassword({ onClose }) {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    if (pwd.length < 8) return setMsg('❌ 8 caractères minimum')
    if (pwd !== pwd2) return setMsg('❌ Les mots de passe ne correspondent pas')
    setSaving(true); setMsg('')
    try {
      const { error } = await db().auth.updateUser({ password: pwd })
      if (error) throw error
      setMsg('✅ Mot de passe mis à jour !')
      setTimeout(() => onClose(), 1500)
    } catch (e) { setMsg('❌ ' + e.message) }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          type={showPwd ? 'text' : 'password'}
          value={pwd} onChange={e => setPwd(e.target.value)}
          placeholder="Nouveau mot de passe (8 car. min)"
          style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
        <button onClick={() => setShowPwd(!showPwd)} type="button"
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>
          {showPwd ? '🙈' : '👁️'}
        </button>
      </div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          type={showPwd ? 'text' : 'password'}
          value={pwd2} onChange={e => setPwd2(e.target.value)}
          placeholder="Confirmer le mot de passe"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      {msg && (
        <div style={{ fontSize: 12, color: msg.startsWith('✅') ? '#22C55E' : '#EF4444', marginBottom: 10 }}>
          {msg}
        </div>
      )}
      <button onClick={save} disabled={saving}
        style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#0066FF', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        {saving ? '...' : 'Enregistrer'}
      </button>
    </div>
  )
}