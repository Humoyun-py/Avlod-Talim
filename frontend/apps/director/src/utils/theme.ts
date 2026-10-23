/**
 * Avlod Ta'lim permanent signature brand color: #5C42FD (Binafsharang)
 * Ensures the web application always strictly and permanently uses Avlod purple.
 */
export const AVLOD_PERMANENT_PURPLE = '#5C42FD';
const THEME_STYLE_ID = 'avlod-dynamic-theme-style';

export function applyBrandTheme(colorHex: string = AVLOD_PERMANENT_PURPLE): void {
  const styleTag = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (styleTag) {
    styleTag.innerHTML = '';
  }

  // Always enforce Avlod permanent purple
  document.documentElement.style.setProperty('--brand-primary', AVLOD_PERMANENT_PURPLE);
}

export function initSavedTheme(): void {
  try {
    const raw = localStorage.getItem('avlod_director_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.primaryColor !== AVLOD_PERMANENT_PURPLE) {
        parsed.primaryColor = AVLOD_PERMANENT_PURPLE;
        localStorage.setItem('avlod_director_settings_v1', JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }

  applyBrandTheme(AVLOD_PERMANENT_PURPLE);
}


