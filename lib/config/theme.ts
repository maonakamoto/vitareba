/**
 * Raw hex values for the design system palette.
 * CSS variables are the primary reference — see app/globals.css :root.
 * These constants exist for contexts that cannot use CSS variables (e.g. PWA manifest, OG images).
 * If a color changes, update both here and the corresponding var in globals.css.
 */

/** --ink: primary text, dark backgrounds */
export const COLOR_INK = "#1a1a22";

/** --ink2: secondary dark text */
export const COLOR_INK2 = "#3a3a4a";

/** --muted: nav links, captions, metadata (darkened from #888a96 for WCAG AA on white) */
export const COLOR_MUTED = "#71727c";

/** --faint: decorative lines, faint text */
export const COLOR_FAINT = "#c4c0b8";

/** --teal: primary accent — CTAs, links, active states */
export const COLOR_TEAL = "#2a7a8a";

/** --teal-dark: teal hover state */
export const COLOR_TEAL_DARK = "#1e6672";

/** --gold: secondary accent — highlights, decorative */
export const COLOR_GOLD = "#b8960a";

/** --off: off-white section backgrounds */
export const COLOR_OFF = "#f8f7f4";

/** --light: light section backgrounds */
export const COLOR_LIGHT = "#f1ede7";

/** --border: borders, dividers */
export const COLOR_BORDER = "#e5e0d8";

/** --warn: warning states */
export const COLOR_WARN = "#d4820a";

/** --danger: low scores, errors */
export const COLOR_DANGER = "#e05a5a";

/** white */
export const COLOR_WHITE = "#ffffff";
