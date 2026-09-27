export type MixRecipeId = 'nature' | 'voice' | 'asmr';

export type MixRecipe = {
  id: MixRecipeId;
  label: string;
  detail: string;
  symbol: string;
};

export const mixRecipes: MixRecipe[] = [
  { id: 'nature', label: '自然环境声', detail: '海浪 · 风 · 森林', symbol: '◌' },
  { id: 'voice', label: '人声片段', detail: '一句话 · 回响', symbol: '◉' },
  { id: 'asmr', label: 'ASMR', detail: '细碎 · 近距离', symbol: '✳' },
];

export function getMixRecipe(id: string): MixRecipe {
  return mixRecipes.find(recipe => recipe.id === id) ?? mixRecipes[0];
}

