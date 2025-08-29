import { monitorImageProcessing } from './observability';

export interface SustainabilityMetrics {
  score: number; // 0-100
  badges: string[];
  factors: {
    material: number;
    production: number;
    transport: number;
    durability: number;
  };
}

export const SUSTAINABILITY_BADGES = {
  ORGANIC: 'Organic Materials',
  RECYCLED: 'Recycled Content',
  FAIR_TRADE: 'Fair Trade',
  CARBON_NEUTRAL: 'Carbon Neutral',
  WATER_EFFICIENT: 'Water Efficient',
  CRUELTY_FREE: 'Cruelty Free',
  LOCAL_MADE: 'Locally Made',
  DURABLE: 'Built to Last'
};

export const BRAND_SUSTAINABILITY: Record<string, number> = {
  'patagonia': 95,
  'eileen fisher': 90,
  'reformation': 85,
  'everlane': 80,
  'uniqlo': 60,
  'zara': 40,
  'h&m': 45,
  'nike': 70,
  'adidas': 75
};

export function calculateSustainabilityScore(item: {
  brand?: string;
  fabric?: string;
  category: string;
  colors?: string[];
}): SustainabilityMetrics {
  const span = monitorImageProcessing('calculateSustainabilityScore', { brand: item.brand });
  
  let score = 50; // Base score
  const badges: string[] = [];
  const factors = {
    material: 50,
    production: 50,
    transport: 50,
    durability: 50
  };

  // Brand sustainability rating
  if (item.brand) {
    const brandScore = BRAND_SUSTAINABILITY[item.brand.toLowerCase()] || 50;
    factors.production = brandScore;
    score = (score + brandScore) / 2;
  }

  // Material scoring
  if (item.fabric) {
    const fabric = item.fabric.toLowerCase();
    if (fabric.includes('organic')) {
      factors.material += 30;
      badges.push(SUSTAINABILITY_BADGES.ORGANIC);
    }
    if (fabric.includes('recycled')) {
      factors.material += 25;
      badges.push(SUSTAINABILITY_BADGES.RECYCLED);
    }
    if (fabric.includes('hemp') || fabric.includes('linen')) {
      factors.material += 20;
    }
    if (fabric.includes('polyester') && !fabric.includes('recycled')) {
      factors.material -= 20;
    }
  }

  // Category durability
  const durableCategories = ['outerwear', 'boots', 'jeans', 'coats'];
  if (durableCategories.includes(item.category)) {
    factors.durability += 20;
    badges.push(SUSTAINABILITY_BADGES.DURABLE);
  }

  // Color impact (darker colors often require less water/chemicals)
  if (item.colors && item.colors.length > 0) {
    const darkColors = ['black', 'navy', 'brown', 'gray'];
    const hasDarkColor = item.colors.some(c => darkColors.includes(c.toLowerCase()));
    if (hasDarkColor) {
      factors.material += 10;
    }
  }

  // Calculate final score
  const avgFactors = Object.values(factors).reduce((a, b) => a + b, 0) / 4;
  score = Math.min(100, Math.max(0, avgFactors));

  // Normalize factors
  Object.keys(factors).forEach(key => {
    factors[key as keyof typeof factors] = Math.min(100, Math.max(0, factors[key as keyof typeof factors]));
  });

  span.end();

  return {
    score: Math.round(score),
    badges,
    factors
  };
}

export function getSustainabilityFilters() {
  return {
    badges: Object.values(SUSTAINABILITY_BADGES),
    minScore: [0, 25, 50, 75, 90],
    brands: Object.keys(BRAND_SUSTAINABILITY).map(brand => ({
      name: brand,
      score: BRAND_SUSTAINABILITY[brand]
    })).sort((a, b) => b.score - a.score)
  };
}

export function filterItemsBySustainability(
  items: Array<{
    id: string;
    sustainabilityScore?: number;
    sustainabilityBadges?: string[];
  }>,
  filters: {
    minScore?: number;
    requiredBadges?: string[];
  }
): string[] {
  return items
    .filter(item => {
      if (filters.minScore && (item.sustainabilityScore || 0) < filters.minScore) {
        return false;
      }
      if (filters.requiredBadges && filters.requiredBadges.length > 0) {
        const itemBadges = item.sustainabilityBadges || [];
        return filters.requiredBadges.every(badge => itemBadges.includes(badge));
      }
      return true;
    })
    .map(item => item.id);
}
