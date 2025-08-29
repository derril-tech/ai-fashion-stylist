import { monitorImageProcessing } from './observability';

// Color wheel positions and compatibility rules
export interface ColorRule {
  name: string;
  hex: string;
  lab: [number, number, number]; // L, a, b values
  hue: number; // 0-360 degrees
  saturation: number; // 0-100
  lightness: number; // 0-100
}

export interface OutfitRule {
  type: 'color' | 'texture' | 'formality' | 'category';
  rule: string;
  rationale: string;
  weight: number; // 0-1 importance
}

export interface OutfitValidation {
  isValid: boolean;
  score: number; // 0-100
  rules: OutfitRule[];
  rationale: string[];
  suggestions: string[];
}

// Fashion color wheel with LAB values
export const FASHION_COLORS: ColorRule[] = [
  // Primary colors
  { name: 'red', hex: '#FF0000', lab: [53.24, 80.09, 67.20], hue: 0, saturation: 100, lightness: 50 },
  { name: 'blue', hex: '#0000FF', lab: [32.30, 79.19, -107.86], hue: 240, saturation: 100, lightness: 50 },
  { name: 'yellow', hex: '#FFFF00', lab: [97.14, -21.55, 94.48], hue: 60, saturation: 100, lightness: 50 },
  
  // Secondary colors
  { name: 'green', hex: '#00FF00', lab: [87.73, -86.18, 83.18], hue: 120, saturation: 100, lightness: 50 },
  { name: 'purple', hex: '#800080', lab: [30.33, 58.20, -36.78], hue: 300, saturation: 100, lightness: 25 },
  { name: 'orange', hex: '#FFA500', lab: [74.93, 23.93, 78.95], hue: 30, saturation: 100, lightness: 50 },
  
  // Neutrals
  { name: 'black', hex: '#000000', lab: [0, 0, 0], hue: 0, saturation: 0, lightness: 0 },
  { name: 'white', hex: '#FFFFFF', lab: [100, 0, 0], hue: 0, saturation: 0, lightness: 100 },
  { name: 'gray', hex: '#808080', lab: [53.59, 0, 0], hue: 0, saturation: 0, lightness: 50 },
  { name: 'navy', hex: '#000080', lab: [12.97, 47.56, -64.70], hue: 240, saturation: 100, lightness: 25 },
  { name: 'brown', hex: '#A52A2A', lab: [35.56, 47.53, 26.89], hue: 0, saturation: 75, lightness: 40 },
  
  // Fashion colors
  { name: 'pink', hex: '#FFC0CB', lab: [83.24, 32.30, 5.84], hue: 350, saturation: 100, lightness: 75 },
  { name: 'mint', hex: '#98FF98', lab: [91.11, -25.63, 15.72], hue: 120, saturation: 100, lightness: 75 },
  { name: 'rose', hex: '#FFE4E1', lab: [93.47, 8.47, 5.31], hue: 6, saturation: 100, lightness: 90 },
  { name: 'gold', hex: '#FFD700', lab: [85.41, 9.57, 85.31], hue: 51, saturation: 100, lightness: 50 },
  { name: 'silver', hex: '#C0C0C0', lab: [77.70, 0, 0], hue: 0, saturation: 0, lightness: 75 },
];

// Color compatibility rules
export const COLOR_COMPATIBILITY = {
  complementary: 180, // Opposite on color wheel
  analogous: 30, // Adjacent colors
  triadic: 120, // Three colors equally spaced
  split_complementary: 150, // One base + two colors adjacent to its complement
  tetradic: 90, // Four colors forming a rectangle
  monochromatic: 0, // Same hue, different saturation/lightness
};

// Texture compatibility matrix
export const TEXTURE_COMPATIBILITY = {
  smooth: ['smooth', 'textured', 'patterned'],
  textured: ['smooth', 'textured', 'patterned'],
  patterned: ['smooth', 'textured', 'patterned'],
  rough: ['smooth', 'textured'],
  shiny: ['matte', 'textured'],
  matte: ['shiny', 'textured', 'patterned'],
};

// Formality levels
export const FORMALITY_LEVELS = {
  casual: 1,
  smart_casual: 2,
  business_casual: 3,
  business: 4,
  formal: 5,
  black_tie: 6,
};

// Category compatibility rules
export const CATEGORY_COMPATIBILITY = {
  tops: ['bottoms', 'outerwear', 'accessories'],
  bottoms: ['tops', 'outerwear', 'accessories'],
  outerwear: ['tops', 'bottoms', 'accessories'],
  dresses: ['outerwear', 'accessories', 'shoes'],
  shoes: ['tops', 'bottoms', 'dresses', 'accessories'],
  accessories: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes'],
};

export function findNearestColor(labColor: [number, number, number]): ColorRule {
  let nearest = FASHION_COLORS[0];
  let minDistance = Number.MAX_VALUE;

  for (const color of FASHION_COLORS) {
    const distance = euclideanDistance(labColor, color.lab);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = color;
    }
  }

  return nearest;
}

export function calculateColorCompatibility(color1: ColorRule, color2: ColorRule): number {
  const hueDiff = Math.abs(color1.hue - color2.hue);
  const hueDiffNormalized = Math.min(hueDiff, 360 - hueDiff);

  // Check for specific color relationships
  if (hueDiffNormalized <= COLOR_COMPATIBILITY.analogous) {
    return 0.9; // Analogous colors work well together
  }
  
  if (Math.abs(hueDiffNormalized - COLOR_COMPATIBILITY.complementary) <= 15) {
    return 0.8; // Complementary colors create good contrast
  }
  
  if (Math.abs(hueDiffNormalized - COLOR_COMPATIBILITY.triadic) <= 20) {
    return 0.7; // Triadic colors are harmonious
  }
  
  if (hueDiffNormalized <= 30) {
    return 0.6; // Similar colors work together
  }
  
  // Check for neutral combinations
  if (isNeutral(color1) || isNeutral(color2)) {
    return 0.7; // Neutrals go with most colors
  }
  
  if (hueDiffNormalized > 120) {
    return 0.3; // Very different colors may clash
  }
  
  return 0.5; // Neutral compatibility
}

export function isNeutral(color: ColorRule): boolean {
  return ['black', 'white', 'gray', 'navy', 'brown'].includes(color.name);
}

export function validateTextureCompatibility(texture1: string, texture2: string): boolean {
  const compatibleTextures = TEXTURE_COMPATIBILITY[texture1 as keyof typeof TEXTURE_COMPATIBILITY] || [];
  return compatibleTextures.includes(texture2);
}

export function validateFormalityCompatibility(formality1: string, formality2: string): boolean {
  const level1 = FORMALITY_LEVELS[formality1 as keyof typeof FORMALITY_LEVELS] || 3;
  const level2 = FORMALITY_LEVELS[formality2 as keyof typeof FORMALITY_LEVELS] || 3;
  
  // Allow 1 level difference for flexibility
  return Math.abs(level1 - level2) <= 1;
}

export function validateCategoryCompatibility(category1: string, category2: string): boolean {
  const compatibleCategories = CATEGORY_COMPATIBILITY[category1 as keyof typeof CATEGORY_COMPATIBILITY] || [];
  return compatibleCategories.includes(category2);
}

export function validateOutfit(items: Array<{
  colors: string[];
  texture: string;
  formality: string;
  category: string;
}>): OutfitValidation {
  const span = monitorImageProcessing('validateOutfit', { itemCount: items.length });
  
  const rules: OutfitRule[] = [];
  const rationale: string[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;
  let validCombinations = 0;
  let totalCombinations = 0;

  // Check all pairwise combinations
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      totalCombinations++;
      const item1 = items[i];
      const item2 = items[j];

      // Color compatibility
      const colorScore = validateColorCompatibility(item1.colors, item2.colors);
      if (colorScore > 0.6) {
        validCombinations++;
        rules.push({
          type: 'color',
          rule: `Colors ${item1.colors.join(', ')} and ${item2.colors.join(', ')} work well together`,
          rationale: `Color compatibility score: ${(colorScore * 100).toFixed(0)}%`,
          weight: colorScore
        });
        rationale.push(`Good color harmony between ${item1.category} and ${item2.category}`);
      } else if (colorScore < 0.3) {
        rules.push({
          type: 'color',
          rule: `Colors ${item1.colors.join(', ')} and ${item2.colors.join(', ')} may clash`,
          rationale: `Consider using neutral colors or complementary shades`,
          weight: 0.8
        });
        suggestions.push(`Try pairing ${item1.category} with neutral colors`);
      }

      // Texture compatibility
      if (validateTextureCompatibility(item1.texture, item2.texture)) {
        validCombinations++;
        rules.push({
          type: 'texture',
          rule: `${item1.texture} and ${item2.texture} textures complement each other`,
          rationale: 'Textures create visual interest without overwhelming',
          weight: 0.7
        });
      } else {
        rules.push({
          type: 'texture',
          rule: `${item1.texture} and ${item2.texture} textures may not work well together`,
          rationale: 'Consider balancing smooth and textured pieces',
          weight: 0.6
        });
        suggestions.push(`Balance ${item1.texture} texture with contrasting textures`);
      }

      // Formality compatibility
      if (validateFormalityCompatibility(item1.formality, item2.formality)) {
        validCombinations++;
        rules.push({
          type: 'formality',
          rule: `${item1.formality} and ${item2.formality} formality levels are compatible`,
          rationale: 'Formality levels create a cohesive look',
          weight: 0.8
        });
      } else {
        rules.push({
          type: 'formality',
          rule: `${item1.formality} and ${item2.formality} formality levels may not match`,
          rationale: 'Consider matching formality levels for better cohesion',
          weight: 0.7
        });
        suggestions.push(`Match formality levels between ${item1.category} and ${item2.category}`);
      }

      // Category compatibility
      if (validateCategoryCompatibility(item1.category, item2.category)) {
        validCombinations++;
        rules.push({
          type: 'category',
          rule: `${item1.category} and ${item2.category} categories work well together`,
          rationale: 'These categories are designed to be paired',
          weight: 0.9
        });
      } else {
        rules.push({
          type: 'category',
          rule: `${item1.category} and ${item2.category} categories may not be ideal`,
          rationale: 'Consider standard category pairings',
          weight: 0.5
        });
      }

      totalScore += (colorScore + 0.7 + 0.8 + 0.9) / 4; // Average of all compatibility scores
    }
  }

  const overallScore = totalCombinations > 0 ? (validCombinations / totalCombinations) * 100 : 100;
  const isValid = overallScore >= 60;

  if (!isValid) {
    rationale.push('Outfit needs adjustments for better compatibility');
  } else {
    rationale.push('Outfit has good overall compatibility');
  }

  span.end();

  return {
    isValid,
    score: Math.round(overallScore),
    rules,
    rationale,
    suggestions
  };
}

function validateColorCompatibility(colors1: string[], colors2: string[]): number {
  let maxCompatibility = 0;

  for (const color1 of colors1) {
    for (const color2 of colors2) {
      const colorRule1 = FASHION_COLORS.find(c => c.name === color1);
      const colorRule2 = FASHION_COLORS.find(c => c.name === color2);
      
      if (colorRule1 && colorRule2) {
        const compatibility = calculateColorCompatibility(colorRule1, colorRule2);
        maxCompatibility = Math.max(maxCompatibility, compatibility);
      }
    }
  }

  return maxCompatibility;
}

function euclideanDistance(lab1: [number, number, number], lab2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  );
}

// Generate outfit suggestions based on rules
export function generateOutfitSuggestions(items: Array<{
  id: string;
  colors: string[];
  texture: string;
  formality: string;
  category: string;
}>): Array<{
  items: string[];
  score: number;
  rationale: string;
}> {
  const span = monitorImageProcessing('generateOutfitSuggestions', { itemCount: items.length });
  
  const suggestions: Array<{
    items: string[];
    score: number;
    rationale: string;
  }> = [];

  // Generate combinations of 2-4 items
  for (let size = 2; size <= Math.min(4, items.length); size++) {
    const combinations = generateCombinations(items, size);
    
    for (const combination of combinations) {
      const validation = validateOutfit(combination);
      
      if (validation.isValid && validation.score >= 70) {
        suggestions.push({
          items: combination.map(item => item.id),
          score: validation.score,
          rationale: validation.rationale.join('; ')
        });
      }
    }
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);

  span.end();
  return suggestions.slice(0, 10); // Return top 10 suggestions
}

function generateCombinations<T>(array: T[], size: number): T[][] {
  if (size === 1) return array.map(item => [item]);
  
  const combinations: T[][] = [];
  
  for (let i = 0; i <= array.length - size; i++) {
    const head = array[i];
    const tailCombinations = generateCombinations(array.slice(i + 1), size - 1);
    
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  
  return combinations;
}
