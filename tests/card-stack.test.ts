import { describe, expect, it } from 'vitest';
import { signedOffset, wrapIndex } from '../components/ui/card-stack';

describe('card stack navigation math', () => {
  it('wraps navigation indexes in both directions', () => {
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(4, 4)).toBe(0);
  });

  it('uses the shortest fan offset when looping', () => {
    expect(signedOffset(4, 0, 5, true)).toBe(-1);
    expect(signedOffset(4, 0, 5, false)).toBe(4);
  });
});
