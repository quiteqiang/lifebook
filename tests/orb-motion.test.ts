import { describe, expect, it } from 'vitest';
import { advanceOrbMotion, orbFrameDelta } from '@/components/ui/voice-powered-orb';

const initial = { level: 0, time: 0, rotation: 0 };
const options = { maxRotationSpeed: 1.2, maxHoverIntensity: 0.8 };

describe('voice orb motion', () => {
  it('uses elapsed time at low frame rates but bounds a long resume gap', () => {
    expect(orbFrameDelta(0, 100)).toBe(0);
    expect(orbFrameDelta(100, 300)).toBeCloseTo(0.2);
    expect(orbFrameDelta(300, 2300)).toBeCloseTo(0.05);
  });

  it('drifts gently while silent and eases into and out of speaking motion', () => {
    const idle = advanceOrbMotion(initial, 0, 0.12, false, options);
    const speaking = advanceOrbMotion(idle, 1, 0.12, false, options);
    const released = advanceOrbMotion(speaking, 0, 0.12, false, options);

    expect(idle.time).toBeGreaterThan(0);
    expect(idle.rotation).toBeGreaterThan(0);
    expect(idle.hover).toBeGreaterThan(0);
    expect(idle.hoverIntensity).toBeLessThan(0.2);
    expect(speaking.level).toBeGreaterThan(0);
    expect(speaking.level).toBeLessThan(1);
    expect(speaking.hoverIntensity).toBeGreaterThan(idle.hoverIntensity);
    expect(released.level).toBeGreaterThan(0);
    expect(released.level).toBeLessThan(speaking.level);
    expect(released.hoverIntensity).toBeLessThan(speaking.hoverIntensity);
  });

  it('produces nearly the same motion over equal time at different refresh rates', () => {
    const run = (frames: number) => {
      let state = initial;
      for (let i = 0; i < frames; i++) state = advanceOrbMotion(state, 0.7, 1 / frames, false, options);
      return state;
    };
    const at60 = run(60);
    const at120 = run(120);
    expect(at120.level).toBeCloseTo(at60.level, 5);
    expect(at120.rotation).toBeCloseTo(at60.rotation, 2);
    expect(at120.time).toBeCloseTo(at60.time, 2);
  });

  it('freezes all visible motion for reduced motion', () => {
    const previous = { level: 0.6, time: 2, rotation: 1 };
    const reduced = advanceOrbMotion(previous, 1, 0.12, true, options);
    expect(reduced).toEqual({ level: 0, time: 2, rotation: 1, hover: 0, hoverIntensity: 0 });
  });
});
