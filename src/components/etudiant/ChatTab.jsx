import { useState, useEffect, useRef } from 'react'
import { db } from '../../lib/supabase.js'
import { CS } from '../../constants.js'

const CATEGORIES = [
  { id: 'anniversaire', label: '🎂 Anniversaire' },
  { id: 'sortie', label: '🎉 Sortie' },
  { id: 'discussion', label: '💬 Discussion' },
  { id: 'scolaire', label: '📚 Scolaire' },
  { id: 'sport', label: '⚽ Sport' },
  { id: 'autre', label: '✨ Autre' },
]

const CGU_CHAT = `Conditions d'utilisation du Chat StuDiscount

En utilisant le chat StuDiscount, vous vous engagez à :

1. Ne pas envoyer de messages à caractère haineux, insultant ou discriminatoire.
2. Ne pas harceler, menacer ou intimider d'autres utilisateurs.
3. Ne pas partager de contenu à caractère sexuel ou pornographique.
4. Ne pas usurper l'identité d'une autre personne.
5. Respecter la vie privée des autres membres.
6. Ne pas faire de publicité ou de spam.
7. Signaler tout contenu inapproprié à l'équipe StuDiscount.

Tout manquement entraînera la suspension immédiate du compte.
StuDiscount se réserve le droit de lire les messages pour modération.`

// ── Signature CGU ──────────────────────────────────────────
function ChatCGU({ etudiant, onAccept }) {
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef(null)

  const handleScroll = () => {
    if (!ref.current) return
    const { scrollTop, scrollHeight, clientHeight } = ref.current
    if (scrollTop + clientHeight >= scrollHeight - 20) setScrolled(true)
  }

  const accept = async () => {
    setLoading(true)
    await db().from('chat_cgu_signatures').insert({ etudiant_id: etudiant.id })
    onAccept()
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 16px 80px' }}>
      <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💬</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: CS.text, textAlign: 'center', marginBottom: 4 }}>Chat StuDiscount</div>
      <div style={{ fontSize: 13, color: CS.muted, textAlign: 'center', marginBottom: 16 }}>Lis et accepte les conditions avant d'utiliser le chat</div>
      <div ref={ref} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', background: '#F8F8F8', borderRadius: 12, padding: 16, fontSize: 13, color: CS.text, lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 16 }}>
        {CGU_CHAT}
      </div>
      {!scrolled && <div style={{ color: CS.muted, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>⬇️ Fais défiler jusqu'en bas pour accepter</div>}
      <button disabled={!scrolled || loading} onClick={accept} style={{
        padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit',
        background: scrolled ? 'linear-gradient(135deg,#0066FF,#3399FF)' : '#D1D5DB',
        color: 'white', fontSize: 14, fontWeight: 800, cursor: scrolled ? 'pointer' : 'default'
      }}>
        {loading ? '...' : "J'accepte les conditions du chat"}
      </button>
    </div>
  )
}

// ── Création groupe ────────────────────────────────────────
function CreerGroupe({ etudiant, onBack, onCreated }) {
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'discussion' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const creer = async () => {
    if (!form.nom.trim()) return setError('Le nom du groupe est obligatoire')
    setLoading(true); setError('')
    try {
      const { data: groupe, error: e } = await db().from('chat_groupes').insert({
        nom: form.nom.trim(),
        description: form.description.trim() || null,
        categorie: form.categorie,
        admin_id: etudiant.id,
        statut: 'actif',
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }).select().single()
      if (e) throw e
      // Ajouter le créateur comme membre admin actif
      await db().from('chat_membres').insert({
        groupe_id: groupe.id,
        etudiant_id: etudiant.id,
        role: 'admin',
        statut: 'actif',
        joined_at: new Date().toISOString()
      })
      onCreated(groupe)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: CS.muted }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 900, color: CS.text }}>Créer un groupe</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Nom du groupe *</div>
        <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value.slice(0, 60) }))}
          placeholder="Ex: Les BFF de la fac" maxLength={60}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${CS.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ color: CS.muted, fontSize: 11, marginTop: 4 }}>{form.nom.length}/60</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 200) }))}
          placeholder="De quoi parle ce groupe ?" rows={3} maxLength={200}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${CS.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Catégorie</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, categorie: c.id }))} style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              background: form.categorie === c.id ? '#0066FF' : '#F0F0F0',
              color: form.categorie === c.id ? 'white' : CS.text, fontWeight: form.categorie === c.id ? 700 : 400
            }}>{c.label}</button>
          ))}
        </div>
      </div>
      {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
      <button onClick={creer} disabled={loading} style={{
        width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: 'inherit',
        background: 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer'
      }}>{loading ? '...' : 'Créer le groupe 🚀'}</button>
    </div>
  )
}

// ── Écran messages ─────────────────────────────────────────
function GroupeMessages({ groupe, etudiant, onBack, onGroupeUpdated }) {
  const [messages, setMessages] = useState([])
  const [membres, setMembres] = useState([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState('messages') // messages | membres | inviter
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const bottomRef = useRef(null)
  const isAdmin = groupe.admin_id === etudiant.id

  useEffect(() => {
    loadMessages()
    loadMembres()
    // Realtime subscription
    const channel = db().channel(`chat_${groupe.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `groupe_id=eq.${groupe.id}` },
        payload => {
          setMessages(prev => [...prev, payload.new])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
      .subscribe()
    return () => db().removeChannel(channel)
  }, [groupe.id])

  const loadMessages = async () => {
    // Récupérer la date d'entrée dans le groupe
    const { data: membre } = await db().from('chat_membres')
      .select('joined_at')
      .eq('groupe_id', groupe.id)
      .eq('etudiant_id', etudiant.id)
      .maybeSingle()
    const joinedAt = membre?.joined_at || '2000-01-01'

    // Charger les messages depuis cette date
    const { data: msgs } = await db().from('chat_messages')
      .select('id, etudiant_id, contenu, created_at')
      .eq('groupe_id', groupe.id)
      .gte('created_at', joinedAt)
      .order('created_at', { ascending: true })

    if (!msgs) { setMessages([]); setLoading(false); return }

    // Charger les prénoms
    const etudiantIds = [...new Set(msgs.map(m => m.etudiant_id))]
    const { data: etudiantsData } = etudiantIds.length > 0
      ? await db().from('etudiants').select('id, prenom').in('id', etudiantIds)
      : { data: [] }

    setMessages(msgs.map(m => ({
      ...m,
      etudiants: etudiantsData?.find(e => e.id === m.etudiant_id)
    })))
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const loadMembres = async () => {
    const { data: membresData } = await db().from('chat_membres')
      .select('id, etudiant_id, role, statut, invited_by, joined_at')
      .eq('groupe_id', groupe.id)
      .neq('statut', 'refuse')
    if (!membresData) { setMembres([]); return }
    const etudiantIds = membresData.map(m => m.etudiant_id).filter(Boolean)
    const { data: etudiantsData } = etudiantIds.length > 0
      ? await db().from('etudiants').select('id, prenom, email').in('id', etudiantIds)
      : { data: [] }
    setMembres(membresData.map(m => ({
      ...m,
      etudiants: etudiantsData?.find(e => e.id === m.etudiant_id)
    })))
  }

  const envoyer = async () => {
    if (!texte.trim() || sending) return
    setSending(true)
    await db().from('chat_messages').insert({
      groupe_id: groupe.id,
      etudiant_id: etudiant.id,
      contenu: texte.trim()
    })
    await db().from('chat_groupes').update({ last_activity_at: new Date().toISOString() }).eq('id', groupe.id)
    setTexte('')
    setSending(false)
  }

  const inviter = async () => {
    if (!inviteEmail.trim()) return
    setInviteLoading(true); setInviteMsg('')
    try {
      // Vérifier que l'email existe dans etudiants
      const { data: invitee } = await db().from('etudiants').select('id, prenom').eq('email', inviteEmail.trim().toLowerCase()).maybeSingle()
      if (!invitee) { setInviteMsg('❌ Aucun étudiant trouvé avec cet email'); setInviteLoading(false); return }
      // Vérifier déjà membre
      const { data: dejaMembre } = await db().from('chat_membres').select('id,statut').eq('groupe_id', groupe.id).eq('etudiant_id', invitee.id).maybeSingle()
      if (dejaMembre) { setInviteMsg(`⚠️ ${invitee.prenom} est déjà dans le groupe`); setInviteLoading(false); return }
      // Vérifier limite 30 membres
      const actifs = membres.filter(m => m.statut === 'actif' || m.statut === 'invite')
      if (actifs.length >= 30) { setInviteMsg('❌ Limite de 30 membres atteinte'); setInviteLoading(false); return }
      await db().from('chat_membres').insert({
        groupe_id: groupe.id,
        etudiant_id: invitee.id,
        role: 'membre',
        statut: 'invite',
        invited_by: etudiant.id
      })
      setInviteMsg(`✅ Invitation envoyée à ${invitee.prenom}`)
      setInviteEmail('')
      loadMembres()
    } catch (e) { setInviteMsg('❌ Erreur, réessaie') }
    setInviteLoading(false)
  }

  const donnerAdmin = async (membreId, etudiantId) => {
    if (!window.confirm('Donner les droits admin à ce membre ? Vous perdrez votre statut admin.')) return
    await db().from('chat_membres').update({ role: 'admin' }).eq('id', membreId)
    await db().from('chat_groupes').update({ admin_id: etudiantId }).eq('id', groupe.id)
    onGroupeUpdated()
  }

  const rendreInactif = async () => {
    if (!window.confirm('Rendre ce groupe inactif ? Les membres ne pourront plus envoyer de messages.')) return
    await db().from('chat_groupes').update({ statut: 'inactif' }).eq('id', groupe.id)
    onGroupeUpdated()
  }

  const seDesinscrire = async () => {
    if (!window.confirm('Te désinscrire de ce groupe ?')) return
    await db().from('chat_membres').update({ statut: 'quitte' }).eq('groupe_id', groupe.id).eq('etudiant_id', etudiant.id)
    onBack()
  }

  const cat = CATEGORIES.find(c => c.id === groupe.categorie)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${CS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: CS.muted }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: CS.text }}>{groupe.nom}</div>
            <div style={{ fontSize: 11, color: CS.muted }}>{cat?.label} · {membres.filter(m => m.statut === 'actif').length} membres</div>
          </div>
          {groupe.statut === 'inactif' && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>INACTIF</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['messages', 'membres', ...(isAdmin ? ['inviter', 'admin'] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t ? '#0066FF' : '#F0F0F0',
              color: tab === t ? 'white' : CS.muted
            }}>{t === 'messages' ? '💬' : t === 'membres' ? '👥' : t === 'inviter' ? '➕' : '⚙️'} {t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {tab === 'messages' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {loading ? <div style={{ color: CS.muted, textAlign: 'center' }}>Chargement...</div> :
              messages.length === 0 ? <div style={{ color: CS.muted, textAlign: 'center', marginTop: 40 }}>Aucun message — sois le premier ! 👋</div> :
              messages.map(m => {
                const isMe = m.etudiant_id === etudiant.id
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    {!isMe && <div style={{ fontSize: 11, color: CS.muted, marginBottom: 2, marginLeft: 4 }}>{m.etudiants?.prenom}</div>}
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'linear-gradient(135deg,#0066FF,#3399FF)' : '#F0F0F0',
                      color: isMe ? 'white' : CS.text, fontSize: 14, lineHeight: 1.5
                    }}>{m.contenu}</div>
                    <div style={{ fontSize: 10, color: CS.muted, marginTop: 2 }}>
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            }
            <div ref={bottomRef} />
          </div>
          {groupe.statut === 'actif' ? (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${CS.border}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, paddingBottom: 24 }}>
              <textarea value={texte} onChange={e => setTexte(e.target.value.slice(0, 200))}
                placeholder="Écris un message..." rows={1} maxLength={200}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: `1px solid ${CS.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.4 }} />
              <div style={{ fontSize: 10, color: CS.muted, flexShrink: 0 }}>{texte.length}/200</div>
              <button onClick={envoyer} disabled={!texte.trim() || sending} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: texte.trim() ? 'linear-gradient(135deg,#0066FF,#3399FF)' : '#D1D5DB',
                color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>➤</button>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', textAlign: 'center', color: CS.muted, fontSize: 13, borderTop: `1px solid ${CS.border}`, flexShrink: 0 }}>
              Ce groupe est inactif — les messages sont désactivés
            </div>
          )}
        </>
      )}

      {/* Membres */}
      {tab === 'membres' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {membres.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${CS.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {m.role === 'admin' ? '👑' : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: CS.text }}>{m.etudiants?.prenom}</div>
                <div style={{ fontSize: 11, color: CS.muted }}>{m.statut === 'invite' ? '⏳ Invitation en attente' : m.statut === 'quitte' ? '🚪 A quitté' : m.role === 'admin' ? '👑 Admin' : '👤 Membre'}</div>
              </div>
            </div>
          ))}
          <button onClick={seDesinscrire} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🚪 Me désinscrire du groupe
          </button>
        </div>
      )}

      {/* Inviter */}
      {tab === 'inviter' && isAdmin && (
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{ fontSize: 13, color: CS.muted, marginBottom: 16 }}>Invitez un étudiant par son email StuDiscount</div>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@etudiant.com" type="email"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${CS.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          {inviteMsg && <div style={{ fontSize: 13, marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: inviteMsg.startsWith('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: inviteMsg.startsWith('✅') ? '#22C55E' : '#EF4444' }}>{inviteMsg}</div>}
          <button onClick={inviter} disabled={inviteLoading || !inviteEmail.trim()} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
            background: inviteEmail.trim() ? 'linear-gradient(135deg,#0066FF,#3399FF)' : '#D1D5DB',
            color: 'white', fontSize: 14, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'default'
          }}>{inviteLoading ? '...' : 'Envoyer l\'invitation'}</button>
        </div>
      )}

      {/* Admin */}
      {tab === 'admin' && isAdmin && (
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: CS.text, marginBottom: 12 }}>Donner les droits admin</div>
          {membres.filter(m => m.statut === 'actif' && m.etudiant_id !== etudiant.id).map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${CS.border}` }}>
              <span style={{ fontSize: 13, color: CS.text }}>{m.etudiants?.prenom}</span>
              <button onClick={() => donnerAdmin(m.id, m.etudiant_id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                👑 Nommer admin
              </button>
            </div>
          ))}
          <button onClick={rendreInactif} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔒 Rendre le groupe inactif
          </button>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ChatTab ────────────────────────────
export default function ChatTab({ etudiant }) {
  const [cguSigned, setCguSigned] = useState(null) // null=loading, false=non signé, true=signé
  const [groupes, setGroupes] = useState([])
  const [invitations, setInvitations] = useState([])
  const [screen, setScreen] = useState('list') // list | creer | messages
  const [groupeActif, setGroupeActif] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCgu()
  }, [])

  const checkCgu = async () => {
    const { data } = await db().from('chat_cgu_signatures').select('id').eq('etudiant_id', etudiant.id).maybeSingle()
    setCguSigned(!!data)
    if (data) loadData()
  }

  const loadData = async () => {
    setLoading(true)
    // Groupes dont je suis membre actif — charger séparément
    const { data: memberships } = await db().from('chat_membres')
      .select('groupe_id, role')
      .eq('etudiant_id', etudiant.id)
      .eq('statut', 'actif')

    if (memberships && memberships.length > 0) {
      const groupeIds = memberships.map(m => m.groupe_id)
      const { data: groupesData } = await db().from('chat_groupes')
        .select('*')
        .in('id', groupeIds)
      const rolesMap = {}
      memberships.forEach(m => { rolesMap[m.groupe_id] = m.role })
      setGroupes((groupesData || []).map(g => ({ ...g, monRole: rolesMap[g.id] })))
    } else {
      setGroupes([])
    }

    // Invitations en attente
    const { data: invites } = await db().from('chat_membres')
      .select('id, groupe_id, invited_by')
      .eq('etudiant_id', etudiant.id)
      .eq('statut', 'invite')

    if (invites && invites.length > 0) {
      const invGroupeIds = invites.map(i => i.groupe_id)
      const { data: invGroupes } = await db().from('chat_groupes').select('id, nom, categorie').in('id', invGroupeIds)
      const inviterIds = invites.map(i => i.invited_by).filter(Boolean)
      const { data: inviters } = inviterIds.length > 0 ? await db().from('etudiants').select('id, prenom').in('id', inviterIds) : { data: [] }
      setInvitations(invites.map(i => ({
        ...i,
        chat_groupes: invGroupes?.find(g => g.id === i.groupe_id),
        etudiants: inviters?.find(e => e.id === i.invited_by)
      })))
    } else {
      setInvitations([])
    }
    setLoading(false)
  }

  const repondreInvitation = async (membreId, accepter) => {
    await db().from('chat_membres').update({
      statut: accepter ? 'actif' : 'refuse',
      joined_at: accepter ? new Date().toISOString() : null
    }).eq('id', membreId)
    loadData()
  }

  if (cguSigned === null) return <div style={{ padding: 24, color: CS.muted, textAlign: 'center' }}>Chargement...</div>

  if (!cguSigned) return <ChatCGU etudiant={etudiant} onAccept={() => { setCguSigned(true); loadData() }} />

  if (screen === 'creer') return <CreerGroupe etudiant={etudiant} onBack={() => setScreen('list')} onCreated={g => { setScreen('list'); loadData() }} />

  if (screen === 'messages' && groupeActif) return (
    <GroupeMessages
      groupe={groupeActif}
      etudiant={etudiant}
      onBack={() => { setScreen('list'); loadData() }}
      onGroupeUpdated={() => { loadData(); setScreen('list') }}
    />
  )

  // Liste groupes + invitations
  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: CS.text }}>💬 Chat</div>
        <button onClick={() => setScreen('creer')} style={{
          padding: '8px 16px', borderRadius: 20, border: 'none', fontFamily: 'inherit',
          background: 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'
        }}>+ Nouveau groupe</button>
      </div>

      {/* Invitations */}
      {invitations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            📬 Invitations ({invitations.length})
          </div>
          {invitations.map(inv => {
            const cat = CATEGORIES.find(c => c.id === inv.chat_groupes?.categorie)
            return (
              <div key={inv.id} style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: CS.text, marginBottom: 2 }}>{inv.chat_groupes?.nom}</div>
                <div style={{ fontSize: 11, color: CS.muted, marginBottom: 10 }}>
                  {cat?.label} · Invité(e) par {inv.etudiants?.prenom}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => repondreInvitation(inv.id, true)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#22C55E', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✓ Accepter
                  </button>
                  <button onClick={() => repondreInvitation(inv.id, false)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Refuser
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Groupes */}
      <div style={{ fontSize: 12, fontWeight: 700, color: CS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        Mes groupes ({groupes.length})
      </div>
      {loading ? <div style={{ color: CS.muted, textAlign: 'center', marginTop: 20 }}>Chargement...</div> :
        groupes.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div style={{ color: CS.muted, fontSize: 14 }}>Aucun groupe pour l'instant</div>
            <div style={{ color: CS.muted, fontSize: 12, marginTop: 4 }}>Crée un groupe ou attends une invitation</div>
          </div>
        ) : groupes.map(g => {
          const cat = CATEGORIES.find(c => c.id === g.categorie)
          return (
            <div key={g.id} onClick={() => { setGroupeActif(g); setScreen('messages') }}
              style={{ background: 'white', border: `1px solid ${CS.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: g.statut === 'inactif' ? '#F0F0F0' : '#E8F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {cat?.label.split(' ')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: CS.text }}>{g.nom}</span>
                  {g.monRole === 'admin' && <span style={{ fontSize: 10 }}>👑</span>}
                  {g.statut === 'inactif' && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>INACTIF</span>}
                </div>
                <div style={{ fontSize: 11, color: CS.muted }}>{cat?.label}</div>
              </div>
              <span style={{ color: CS.muted, fontSize: 18 }}>›</span>
            </div>
          )
        })
      }
    </div>
  )
}
