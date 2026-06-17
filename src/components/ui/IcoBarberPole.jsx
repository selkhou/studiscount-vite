export default function IcoBarberPole({ size = 24, color = '#8B5CF6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="1" width="6" height="22" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <path d="M9 4.5 Q12 6 15 4.5 M9 8 Q12 9.5 15 8 M9 11.5 Q12 13 15 11.5 M9 15 Q12 16.5 15 15 M9 18.5 Q12 20 15 18.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="1" r="2.5" fill={color}/>
      <circle cx="12" cy="23" r="2.5" fill={color}/>
    </svg>
  )
}