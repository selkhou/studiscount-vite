export default function StarRating({ value, onChange, size = 20, readOnly = false }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
         onClick={() => { console.log('note:', i); !readOnly && onChange && onChange(i) }}
          style={{
            fontSize: size,
            cursor: readOnly ? 'default' : 'pointer',
            color: i <= value ? '#F59E0B' : '#E8E8E8',
opacity: i <= value ? 1 : 0.4,
            transition: 'color 0.15s'
          }}>
          ★
        </span>
      ))}
    </div>
  )
}