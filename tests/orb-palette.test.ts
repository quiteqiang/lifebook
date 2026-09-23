import { describe, expect, it } from 'vitest';
import { frag } from '@/components/ui/orb-shaders';

describe('voice orb palette', () => {
  it('uses teal and mint colors for the animated voice surface', () => {
    expect(frag).toContain('vec3(0.145098, 0.760784, 0.698039)');
    expect(frag).toContain('vec3(0.274510, 0.913725, 0.827451)');
    expect(frag).not.toContain('0.611765, 0.262745, 0.996078');
  });
});

