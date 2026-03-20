export default function CatIcon({ size = 24, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corpo de perfil */}
      <path d="M 46 54 C 46 40 40 28 28 28 C 22 28 18 36 18 54 Z" fill="currentColor" fillOpacity="0.9" />
      
      {/* Cabeça de perfil (virada para a esquerda) */}
      <circle cx="26" cy="22" r="14" fill="currentColor" fillOpacity="0.9" />
      
      {/* Orelha */}
      <path d="M 22 10 L 30 2 L 36 12 Z" fill="currentColor" fillOpacity="0.9" />
      
      {/* Focinho de perfil */}
      <path d="M 16 22 Q 10 22 10 26 Q 10 32 20 32 Z" fill="currentColor" fillOpacity="0.9" />
      
      {/* Rabo envolto pela frente */}
      <path d="M 46 52 C 54 52 56 42 50 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.8" fill="none" />
      
      {/* Detalhe interno da orelha */}
      <path d="M 24 10 L 29 5 L 33 12 Z" fill="var(--ds-color-primary)" fillOpacity="0.6" />
      
      {/* Nariz */}
      <circle cx="10" cy="24" r="1.5" fill="var(--ds-bg-deep)" />
      
      {/* Olho fechado (sereno) de perfil */}
      <path d="M 18 20 Q 21 23 24 20" stroke="var(--ds-bg-deep)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      {/* Bigodes (reduzidos por ser lado) */}
      <line x1="14" y1="26" x2="6" y2="25" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="14" y1="28" x2="6" y2="29" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
