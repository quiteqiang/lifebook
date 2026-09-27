import { describe, expect, it } from 'vitest';
import { getMixRecipe, mixRecipes } from '@/lib/mix-recipes';

describe('voice tape recipes', () => {
  it('offers nature, voice and ASMR outputs', () => {
    expect(mixRecipes.map(recipe => recipe.id)).toEqual(['nature', 'voice', 'asmr']);
  });

  it('falls back to the nature recipe for an unknown selection', () => {
    expect(getMixRecipe('unknown').id).toBe('nature');
  });
});

