// The contrast helper (src/lib/contrast.ts) against known WCAG values.
import { describe, expect, it } from 'vitest';
import { AA_TEXT, contrastRatio, luminance } from '../../src/lib/contrast';

describe('contrast helpers', () => {
  it('computes luminance of black and white', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('gives 21:1 for black on white, in either order, and 1:1 for equal colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#c2410c', '#c2410c')).toBe(1);
  });

  it('matches published values', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2); // the classic just-failing grey
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('is case-insensitive and rejects other formats', () => {
    expect(luminance('#C2410C')).toBe(luminance('#c2410c'));
    expect(() => luminance('#fff')).toThrow(/6-digit hex/);
    expect(() => luminance('orange')).toThrow(/6-digit hex/);
  });
});
