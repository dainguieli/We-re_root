// Pre-rendered high quality SVG data-URIs for instantaneous and reliable KYC document demo in MVP

export function getDemoStudentCardUri(nom: string, ecole: string, classe: string): string {
  const cleanNom = nom || 'Awa Koffi';
  const cleanEcole = ecole || 'Collège Sainte-Marie';
  const cleanClasse = classe || '3e';
  
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E3A8A"/>
        <stop offset="100%" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <rect width="400" height="240" rx="16" fill="url(#cardGrad)"/>
    <rect x="12" y="12" width="376" height="216" rx="12" fill="none" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="4 2"/>
    
    <!-- Header -->
    <text x="30" y="42" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#93C5FD" letter-spacing="1">CARTE D'IDENTITÉ SCOLAIRE</text>
    <text x="30" y="60" font-family="Arial, sans-serif" font-size="11" fill="#E2E8F0">${cleanEcole.toUpperCase()}</text>
    <text x="340" y="42" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#FDE047">2026-2027</text>

    <!-- Photo Avatar Box -->
    <rect x="30" y="80" width="80" height="95" rx="8" fill="#F8FAFC"/>
    <circle cx="70" cy="115" r="22" fill="#CBD5E1"/>
    <path d="M42 165 C42 140, 98 140, 98 165 Z" fill="#94A3B8"/>

    <!-- Student Details -->
    <text x="130" y="98" font-family="Arial, sans-serif" font-size="10" fill="#93C5FD">ÉLÈVE</text>
    <text x="130" y="118" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">${cleanNom}</text>
    
    <text x="130" y="142" font-family="Arial, sans-serif" font-size="10" fill="#93C5FD">CLASSE</text>
    <text x="130" y="160" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FDE047">${cleanClasse}</text>

    <text x="230" y="142" font-family="Arial, sans-serif" font-size="10" fill="#93C5FD">STATUT</text>
    <text x="230" y="160" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#4ADE80">INSCRIT(E)</text>

    <!-- Barcode mock -->
    <rect x="30" y="190" width="340" height="20" rx="4" fill="#0F172A"/>
    <text x="140" y="204" font-family="monospace" font-size="11" fill="#38BDF8" letter-spacing="3">LKUP-2026-OK</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export function getDemoReceiptUri(nom: string, ecole: string, classe: string): string {
  const cleanNom = nom || 'Awa Koffi';
  const cleanEcole = ecole || 'Collège Sainte-Marie';
  const cleanClasse = classe || '3e';

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
    <rect width="400" height="240" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <rect x="0" y="0" width="400" height="45" fill="#047857" rx="16 16 0 0"/>
    
    <text x="20" y="28" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">CERTIFICAT & REÇU D'INSCRIPTION</text>
    <text x="320" y="28" font-family="Arial, sans-serif" font-size="11" fill="#D1FAE5">ANNÉE 2026</text>

    <text x="25" y="75" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Établissement :</text>
    <text x="130" y="75" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1E293B">${cleanEcole}</text>

    <text x="25" y="105" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Nom de l'élève :</text>
    <text x="130" y="105" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#047857">${cleanNom}</text>

    <text x="25" y="135" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Classe validée :</text>
    <text x="130" y="135" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1E293B">${cleanClasse}</text>

    <text x="25" y="165" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Frais d'inscription :</text>
    <text x="130" y="165" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#10B981">RÉGLÉ - INSCRIPTION VALIDÉE</text>

    <!-- Stamp -->
    <circle cx="330" cy="155" r="32" fill="none" stroke="#DC2626" stroke-width="2" stroke-dasharray="3 2"/>
    <text x="306" y="152" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#DC2626">SCOLARITÉ</text>
    <text x="312" y="166" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#DC2626">VISÉ 2026</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
