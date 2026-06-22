import { useState, useEffect } from 'react'
import { db } from '../../lib/supabase.js'

const SESSION_KEY = 'sondage_vu'

export default function SondageBanniere({ etudiantId = null }) {
  const [sondage, setSondage] = useState(null)
  const [questions, setQuestions] = useState([])
  const [visible, setVisible] = useState(false)
  const [repond, setRepond] = useState(false)

  useEffect(() => {
    // Déjà vu cette session → on n'affiche pas
    if (sessionStorage.getItem(SESSION_KEY)) return

    const load = async () => {
      const { data: s } = await db()
        .from('sondages')
        .select('id,titre')
        .eq('actif', true)
        .limit(1)
        .single()
        console.log('sondage actif:', s)
      if (!s) return

const { data: q, error: qError } = await db()
  .from('questions_sondage')
  .select('id,question,ordre')
  .eq('sondage_id', s.id)
  .order('ordre')
console.log('questions:', q, 'error:', qError)

      if (!q || q.length === 0) return

      setSondage(s)
      setQuestions(q)
      setVisible(true)
    }

    load()
  }, [])

  const fermer = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  const repondre = async (questionId) => {
    if (repond) return
    setRepond(true)
    try {
      await db().from('reponses_sondage').insert({
        sondage_id: sondage.id,
        question_id: questionId,
        etudiant_id: etudiantId || null,
      })
    } catch (e) {
      console.error(e)
    }
    fermer()
  }

  if (!visible || !sondage) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 64,
      left: 0,
      right: 0,
      zIndex: 3040,
      background: '#FFFFFF',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
      borderTop: '1px solid #E5E7EB',
      padding: '12px 16px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{sondage.titre}</div>
        <button onClick={fermer} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: '0 2px'
        }}>✕</button>
      </div>

      {/* Questions — 1 seul clic possible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {questions.map(q => (
          <button key={q.id} onClick={() => repondre(q.id)} disabled={repond}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #E5E7EB',
              background: repond ? '#F9FAFB' : '#FFFFFF',
              color: '#111827',
              fontSize: 13,
              fontWeight: 500,
              textAlign: 'left',
              cursor: repond ? 'default' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!repond) e.currentTarget.style.background = '#F0F4FF' }}
            onMouseLeave={e => { if (!repond) e.currentTarget.style.background = '#FFFFFF' }}
          >
            {q.question}
          </button>
        ))}
      </div>
    </div>
  )
}
