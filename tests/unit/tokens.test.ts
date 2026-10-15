// Text contrast of the color tokens in src/styles/global.css, in light and dark
// mode: every text color must reach 4.5:1 (WCAG AA) on the backgrounds it's
// used on: body text (ink) and muted text (ink-soft) on the page background,
// brand-colored text and links on it, and button labels (on-brand) on the brand
// color. If this fails after a retheme, use a darker (light mode) or lighter
// (dark mode) shade of the brand for text; never lower the bar. The recipe is
// docs/recipes/rebrand-and-retheme.md, step 5.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AA_TEXT, contrastRatio } from '../../src/lib/contrast';

const css = readFileSync('src/styles/global.css', 'utf8');
const tokens = new Map<string, [string, string]>();
for (const m of css.matchAll(/--color-([\w-]+):\s*light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g)) {
  tokens.set(m[1]!, [m[2]!, m[3]!]);
}

// [text, background] pairs the components use.
const pairs = [
  ['ink', 'canvas'], ['ink', 'paper'], ['ink', 'brand-soft'],
  ['ink-soft', 'canvas'], ['ink-soft', 'paper'],
  ['brand', 'canvas'], ['brand', 'paper'], ['brand', 'brand-soft'],
  ['on-brand', 'brand'], ['on-brand', 'brand-strong'],
  ['ok', 'paper'], ['bad', 'paper'], ['ok', 'canvas'], ['bad', 'canvas'],
] as const;

describe('color tokens', () => {
  it('every token has a light and a dark value', () => {
    for (const name of new Set(pairs.flat())) expect(tokens.has(name), `--color-${name}: light-dark(#light, #dark) in src/styles/global.css`).toBe(true);
  });

  for (const [mode, i] of [['light', 0], ['dark', 1]] as const) {
    it.each(pairs.map(([fg, bg]) => [fg, bg]))(`${mode}: %s on %s is at least 4.5:1`, (fg, bg) => {
      const r = contrastRatio(tokens.get(fg)![i], tokens.get(bg)![i]);
      expect(r, `${fg} on ${bg} in ${mode} mode is ${r.toFixed(2)}:1, needs ${AA_TEXT}:1. Use a darker (light) or lighter (dark) shade of the text color; see docs/recipes/rebrand-and-retheme.md step 5`).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }
});
