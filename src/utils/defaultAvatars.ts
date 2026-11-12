// Default Avatars matching Male Suit Silhouette and Female Suit Silhouette

export const MALE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f8fafc"/>
  <path d="M150 40 C120 40 98 65 98 100 C98 132 118 152 140 158 L140 172 L160 172 L160 158 C182 152 202 132 202 100 C202 65 180 40 150 40 Z" fill="#475569"/>
  <path d="M25 300 L25 240 C25 198 72 182 150 182 C228 182 275 198 275 240 L275 300 Z" fill="#475569"/>
  <polygon points="150,255 102,182 198,182" fill="#ffffff"/>
  <polygon points="150,240 115,182 185,182" fill="#f1f5f9"/>
  <polygon points="150,190 160,205 157,300 143,300 140,205" fill="#334155"/>
</svg>
`)}`;

export const FEMALE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f8fafc"/>
  <path d="M82 120 C72 65 98 38 150 38 C202 38 228 65 218 120 C212 170 232 210 232 220 L68 220 C68 210 88 170 82 120 Z" fill="#64748b"/>
  <path d="M150 52 C126 52 108 72 108 105 C108 135 124 152 150 152 C176 152 192 135 192 105 C192 72 174 52 150 52 Z" fill="#e2e8f0"/>
  <rect x="136" y="145" width="28" height="35" fill="#e2e8f0"/>
  <path d="M82 125 C74 65 98 38 150 38 C202 38 226 65 218 125 C213 170 232 235 232 250 C218 250 208 200 202 160 C195 120 192 88 150 88 C108 88 105 120 98 160 C92 200 82 250 68 250 C68 235 86 170 82 125 Z" fill="#64748b"/>
  <path d="M25 300 L25 242 C25 202 72 186 150 186 C228 186 275 202 275 242 L275 300 Z" fill="#64748b"/>
  <polygon points="150,265 112,186 188,186" fill="#ffffff"/>
  <polygon points="150,250 120,186 180,186" fill="#f1f5f9"/>
</svg>
`)}`;

export const getDefaultAvatar = (gender?: string): string => {
  if (!gender) return MALE_AVATAR;
  const g = gender.toString().toLowerCase().trim();
  if (g === 'female' || g === 'أنثى' || g === 'f' || g === 'انثى' || g === 'woman') {
    return FEMALE_AVATAR;
  }
  return MALE_AVATAR;
};
