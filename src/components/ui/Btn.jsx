export default function Btn({ children, onClick, variant = 'primary', disabled, loading }) {
  const styles = {
    primary: {
      background: 'linear-gradient(135deg,#0066FF,#3399FF)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 18px rgba(0,102,255,0.4)'
    },
    outline: {
      background: 'transparent',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: 'none'
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
      boxShadow: 'none'
    },
  }
  const s = styles[variant] || styles.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '15px 0', borderRadius: 14, ...s,
        fontSize: 15, fontWeight: 700,
        cursor: (disabled || loading) ? 'default' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: (disabled || loading) ? 0.45 : 1
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