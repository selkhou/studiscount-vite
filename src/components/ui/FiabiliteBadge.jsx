export default function FiabiliteBadge({ statut, small }) {
  const cfg = {
    valide:     { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', label: '✓ Validé' },
    en_attente: { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', label: '⏳ En attente' },
    refuse:     { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: '✗ Refusé' },
  }[statut] || { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', label: 'Nouveau' }

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: small ? 9 : 11, fontWeight: 700,
      padding: small ? '2px 6px' : '4px 10px',
      borderRadius: 20, whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  )
}