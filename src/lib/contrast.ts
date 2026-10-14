// WCAG color contrast, as plain functions (no Astro imports) so the unit tests
// can use them. tests/unit/tokens.test.ts applies them to the design tokens.

/** Relative luminance of a 6-digit hex color like `#c2410c` (WCAG 2.x). */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected a 6-digit hex color like #c2410c, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1]!.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Contrast ratio between two colors: 1 (identical) to 21 (black on white). Order doesn't matter. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** WCAG AA for normal-size text and for button labels. */
export const AA_TEXT = 4.5;
