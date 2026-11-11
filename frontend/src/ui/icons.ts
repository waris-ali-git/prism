export const ICONS = {
  prismLogo: `
    <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="prismFacetLeft" x1="10" y1="10" x2="34" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#EAE7FC" />
          <stop offset="100%" stop-color="#B9B2EE" />
        </linearGradient>
        <linearGradient id="prismFacetRight" x1="32" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E5F4FD" />
          <stop offset="55%" stop-color="#B8DCF5" />
          <stop offset="100%" stop-color="#FFCDB8" />
        </linearGradient>
      </defs>
      <path d="M32 7L57 52H7L32 7Z" fill="url(#prismFacetRight)" stroke="#8F86D6" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M32 7L32 52H7L32 7Z" fill="url(#prismFacetLeft)" fill-opacity="0.82"/>
      <path d="M32 7L32 52" stroke="#FFFFFF" stroke-width="1.6" stroke-opacity="0.9"/>
      <path d="M32 7L57 52H7L32 7Z" stroke="#8F86D6" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `,
  camera: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3.2"/>
    </svg>
  `,
  arrowRight: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14"/>
      <path d="m13 6 6 6-6 6"/>
    </svg>
  `,
  arrowDown: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 5v14"/>
      <path d="m19 12-7 7-7-7"/>
    </svg>
  `,
  reset: `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  `,
  inside: `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="3.5"/>
    </svg>
  `,
  refresh: `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>
  `,
  close: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `,
  sparkCrystal: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="12 2 21 19 3 19"/>
      <line x1="12" y1="2" x2="12" y2="19"/>
    </svg>
  `,
} as const;

