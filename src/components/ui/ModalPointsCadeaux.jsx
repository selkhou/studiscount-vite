import { useState } from 'react'
import ModalCGU from './ModalCGU.jsx'

export default function ModalPointsCadeaux({ onClose, onConnecte }) {
  const [onglet, setOnglet] = useState('points')
  const [showCGUModal, setShowCGUModal] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 64 }}
      onClick={onClose}>
      <div style={{ background: '#FFFFFF', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
        onClick={e => e.stopPropagation()}>

        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F0F0F0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, zIndex: 10 }}>✕</button>

        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 12, paddingRight: 32 }}>
            <div style={{ color: '#1F1F1F', fontSize: 18, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
              StuDiscount regroupe toutes les promos étudiants de ta ville
            </div>
            <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5 }}>
              Chaque visite, chaque avis, chaque photo te rapproche de réductions encore plus grandes.
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: '2px solid #F0F0F0' }}>
            {[{ k: 'points', l: '🎁 Points & Réductions' }, { k: 'explication', l: 'ℹ️ Explications' }].map(o => (
              <button key={o.k} onClick={() => setOnglet(o.k)}
                style={{ flex: 1, padding: '10px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: onglet === o.k ? 800 : 500, color: onglet === o.k ? '#0066FF' : '#9CA3AF', borderBottom: onglet === o.k ? '3px solid #0066FF' : '3px solid transparent' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', flex: 1 }}>
          {onglet === 'points' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#1F1F1F', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>⭐ Gagne des points</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { action: 'Visite validée (QR scanné)', pts: `+${window.SIOK_PARAMS?.points_qrc || 3} pts`, color: '#0066FF' },
                    { action: 'Avis laissé', pts: `+${window.SIOK_PARAMS?.points_avis || 2} pts`, color: '#22C55E' },
                    { action: 'Photo ajoutée', pts: `+${window.SIOK_PARAMS?.points_photo || 0} pt`, color: '#EC4899' },
                  ].map(r => (
                    <div key={r.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F8F8', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ color: '#374151', fontSize: 13 }}>{r.action}</span>
                      <span style={{ color: r.color, fontWeight: 900, fontSize: 15 }}>{r.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20, background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', borderRadius: 16, padding: '16px' }}>
                <div style={{ color: '#1F1F1F', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>🎁 Tes avantages</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { pts: '250 pts', reward: 'Bon cadeau partenaire 10€ 🎁', color: '#F97316' },
                    { pts: '500 pts', reward: 'Bon cadeau partenaire 40€ 🎁', color: '#EF4444' },
                    { pts: '750 pts', reward: 'Bon cadeau partenaire 70€ 🎁', color: '#8B5CF6' },
                  ].map(r => (
                    <div key={r.pts} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <span style={{ color: '#374151', fontSize: 13 }}>{r.reward}</span>
                      <span style={{ color: r.color, fontWeight: 900, fontSize: 14, flexShrink: 0, marginLeft: 8 }}>{r.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#1F1F1F', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Comment ça marche ?</div>
                {[
                  { icon: '🔍', title: 'Trouve', desc: 'Parcours les offres exclusives étudiants près de chez toi.' },
                  { icon: '🎓', title: 'Présente', desc: 'Montre ta carte étudiante pour bénéficier de la réduction.' },
                  { icon: '📱', title: 'Génère', desc: 'Génère ton QR code et fais-le scanner pour valider ta visite.' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0F6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{step.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#0066FF', fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{step.title}</div>
                      <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => { onClose(); if (onConnecte) onConnecte() }}
                style={{ width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#0066FF,#3399FF)', color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,102,255,0.35)' }}>
                Crée ton compte — gratuit 🚀
              </button>
            </>
          )}

          {onglet === 'explication' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📅', title: 'Limite quotidienne', desc: 'Tu peux gagner au maximum 5 points par jour et 150 points par mois.' },
                { icon: '🎫', title: 'Utiliser tes avantages', desc: 'Génère ton bon cadeau depuis ton profil et récupère-le chez nos partenaires.' },
                { icon: '🔄', title: 'Déduction des points', desc: 'Les points utilisés sont automatiquement déduits. Ton solde se met à jour en temps réel.' },
                { icon: '👤', title: 'Compte obligatoire', desc: 'Crée ton compte gratuitement pour commencer à accumuler tes points.' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F8F8F8', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <button onClick={() => setShowCGUModal(true)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              Conditions Générales d'Utilisation
            </button>
          </div>
        </div>
      </div>
      {showCGUModal && <ModalCGU onClose={() => setShowCGUModal(false)} defaultTab="etudiant" hidePresta />}
    </div>
  )
}