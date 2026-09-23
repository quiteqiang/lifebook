import { describe, expect, it } from 'vitest';
import { getCircularPosition } from '@/components/ui/circular-split-roll';

describe('circular split roll geometry', () => {
  it('places each item on the same circular track', () => {
    const first = getCircularPosition(0, 0, 4, 100);
    const opposite = getCircularPosition(0, 2, 4, 100);

    expect(first.x).toBeCloseTo(100);
    expect(first.y).toBeCloseTo(0);
    expect(opposite.x).toBeCloseTo(-100);
    expect(opposite.y).toBeCloseTo(0);
  });

  it('keeps the front item brighter and larger', () => {
    const front = getCircularPosition(0, 0, 4, 100, Math.PI / 2);
    const back = getCircularPosition(0, 2, 4, 100, Math.PI / 2);

    expect(front.opacity).toBeGreaterThan(back.opacity);
    expect(front.scale).toBeGreaterThan(back.scale);
  });
});

