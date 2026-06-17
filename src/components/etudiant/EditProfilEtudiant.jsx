import { useState } from 'react'
import { CS } from '../../constants.js'

export default function EditProfilEtudiant({ etudiant, onSave, fondPerso, setFondPerso }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inp = (k, label, type = 'text') => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <input type={type} value={form[k] || ''} onChange={e => F(k, e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1.5px solid #E5E7EB', fontSize: 13,
          fontFamily: 'inherit', outline: 'none', color: '#1A1A2E'
        }} />
    </div>
  )

  const startEdit = () => {
    setForm({ prenom: etudiant?.prenom || '', telephone: etudiant?.telephone || '' })
    setEditing(true)
    setMsg('')
  }

  const save = async () => {
    setSaving(true)
    setMsg('')
    const ok = await onSave({ prenom: form.prenom, telephone: form.telephone })
    setMsg(ok ? '✅ Profil mis à jour !' : '❌ Erreur lors de la sauvegarde')
    if (ok) setEditing(false)
    setSaving(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 15 }}>👤 Mon profil</div>
        <button onClick={editing ? () => setEditing(false) : startEdit} style={{
          padding: '5px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB',
          background: 'transparent', color: editing ? '#9CA3AF' : '#0066FF',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {editing ? 'Annuler' : '✏️ Modifier'}
        </button>
      </div>

      {!editing && [
        { l: 'Prénom', v: etudiant?.prenom, icon: '👤' },
        { l: 'Email', v: etudiant?.email, icon: '📧' },
        { l: 'Téléphone', v: etudiant?.telephone, icon: '📱' },
        { l: 'Inscrit le', v: etudiant?.created_at ? new Date(etudiant.created_at).toLocaleDateString('fr-FR') : null, icon: '📅' },
      ].filter(r => r.v).map(({ l, v, icon }) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
          <span style={{ color: '#9CA3AF', fontSize: 12, width: 100, flexShrink: 0 }}>{l}</span>
          <span style={{ color: '#1A1A2E', fontSize: 13, fontWeight: 600, flex: 1 }}>{v}</span>
        </div>
      ))}

      {editing && (
        <div>
          {inp('prenom', 'Prénom')}
          {inp('telephone', 'Téléphone', 'tel')}
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('✅') ? '#22C55E' : '#EF4444', marginBottom: 8 }}>{msg}</div>}
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '11px', borderRadius: 12, border: 'none',
            background: '#0066FF', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 4
          }}>
            {saving ? '...' : '💾 Enregistrer'}
          </button>
        </div>
      )}

      {/* Color picker fond */}
      <div style={{
        marginTop: 12, padding: '12px 14px', borderRadius: 12,
        border: '1.5px solid #E5E7EB', background: '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ color: '#374151', fontSize: 13, fontWeight: 600 }}>🎨 Couleur de fond</div>
          <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>Personnalise ton interface</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color"
            value={fondPerso || window.SIOK_PARAMS?.fond_couleur || '#F5F5F5'}
            onChange={e => {
              const c = e.target.value
              if (setFondPerso) setFondPerso(c)
              window.__stu10_fond = c
              try { localStorage.setItem('stu10_fond_etudiant', c) } catch (ex) {}
            }}
            style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }}
          />
          <button onClick={() => {
            if (setFondPerso) setFondPerso(null)
            window.__stu10_fond = null
            try { localStorage.removeItem('stu10_fond_etudiant') } catch (ex) {}
          }} style={{
            padding: '4px 8px', borderRadius: 8, border: '1px solid #E0E0E0',
            background: 'transparent', color: '#9CA3AF', fontSize: 11,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}