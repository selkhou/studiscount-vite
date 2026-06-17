export default function StudentBtn({ children, onClick, variant = 'primary', disabled, loading, full = true }) {
  const styles = {
    primary: {
      background: '#0066FF',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 16px rgba(0,102,255,0.28)'
    },
    secondary: {
      background: '#F0F0F0',
      color: '#1A1A2E',
      border: 'none',
      boxShadow: 'none'
    },
    outline: {
      background: 'white',
      color: '#1A1A2E',
      border: '2px solid #E8E8E8',
      boxShadow: 'none'
    },
  }
  const s = styles[variant] || styles.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: full ? '100%' : 'auto',
        padding: '16px 24px', borderRadius: 14, ...s,
        fontSize: 15, fontWeight: 700,
        cursor: (disabled || loading) ? 'default' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: (disabled || loading) ? 0.45 : 1,
        transition: 'all 0.15s'
      }}>
      {loading && (
        <span style={{
          width: 16, height: 16,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.8s linear infinite'
        }} />
      )}
      {children}
    </button>
  )
}