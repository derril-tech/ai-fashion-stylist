import { monitorImageProcessing } from './observability';
import { validateOutfit, generateOutfitSuggestions } from './outfit-rules';

export interface OutfitObjective {
  name: string;
  weight: number; // 0-1 importance
  minValue: number;
  maxValue: number;
  targetValue?: number; // Optional target
}

export interface OutfitCandidate {
  items: string[];
  score: number;
  objectives: Record<string, number>;
  rationale: string;
  metadata: {
    styleScore: number;
    noveltyScore: number;
    rewearScore: number;
    costScore: number;
    totalCost: number;
    wearCount: number;
  };
}

export interface OptimizationConfig {
  objectives: OutfitObjective[];
  maxCandidates: number;
  timeLimit: number; // milliseconds
  populationSize: number;
  generations: number;
}

// Default optimization objectives
export const DEFAULT_OBJECTIVES: OutfitObjective[] = [
  {
    name: 'styleScore',
    weight: 0.4,
    minValue: 0,
    maxValue: 100,
    targetValue: 80
  },
  {
    name: 'novelty',
    weight: 0.2,
    minValue: 0,
    maxValue: 100,
    targetValue: 60
  },
  {
    name: 'rewear',
    weight: 0.25,
    minValue: 0,
    maxValue: 100,
    targetValue: 70
  },
  {
    name: 'cost',
    weight: 0.15,
    minValue: 0,
    maxValue: 100,
    targetValue: 50
  }
];

export class OutfitOptimizer {
  private config: OptimizationConfig;
  private itemHistory: Map<string, number> = new Map(); // itemId -> wear count
  private outfitHistory: Set<string> = new Set(); // outfit hash -> seen before

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      objectives: DEFAULT_OBJECTIVES,
      maxCandidates: 6,
      timeLimit: 1500, // 1.5s p95 requirement
      populationSize: 50,
      generations: 10,
      ...config
    };
  }

  async optimizeOutfits(
    items: Array<{
      id: string;
      colors: string[];
      texture: string;
      formality: string;
      category: string;
      cost?: number;
      lastWorn?: Date;
      wearCount?: number;
    }>,
    constraints?: {
      maxCost?: number;
      formality?: string;
      weather?: {
        temperature: number;
        precipitation: number;
      };
      occasion?: string;
    }
  ): Promise<OutfitCandidate[]> {
    const span = monitorImageProcessing('optimizeOutfits', { 
      itemCount: items.length,
      constraints: !!constraints 
    });

    const startTime = Date.now();
    const candidates: OutfitCandidate[] = [];

    // Generate initial population using outfit rules
    const initialSuggestions = generateOutfitSuggestions(items);
    
    for (const suggestion of initialSuggestions) {
      const candidate = await this.evaluateCandidate(suggestion.items, items, constraints);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    // Apply genetic algorithm for optimization
    const optimizedCandidates = await this.geneticOptimization(
      candidates,
      items,
      constraints,
      startTime
    );

    // Sort by weighted objective score
    optimizedCandidates.sort((a, b) => b.score - a.score);

    span.end();

    return optimizedCandidates.slice(0, this.config.maxCandidates);
  }

  private async evaluateCandidate(
    itemIds: string[],
    allItems: Array<{
      id: string;
      colors: string[];
      texture: string;
      formality: string;
      category: string;
      cost?: number;
      lastWorn?: Date;
      wearCount?: number;
    }>,
    constraints?: {
      maxCost?: number;
      formality?: string;
      weather?: { temperature: number; precipitation: number };
      occasion?: string;
    }
  ): Promise<OutfitCandidate | null> {
    const outfitItems = allItems.filter(item => itemIds.includes(item.id));
    
    // Apply constraints
    if (constraints?.maxCost) {
      const totalCost = outfitItems.reduce((sum, item) => sum + (item.cost || 0), 0);
      if (totalCost > constraints.maxCost) {
        return null;
      }
    }

    if (constraints?.formality) {
      const formalityMismatch = outfitItems.some(item => 
        item.formality !== constraints.formality
      );
      if (formalityMismatch) {
        return null;
      }
    }

    // Weather constraints
    if (constraints?.weather) {
      const weatherScore = this.calculateWeatherCompatibility(outfitItems, constraints.weather);
      if (weatherScore < 0.5) {
        return null;
      }
    }

    // Calculate objectives
    const styleScore = this.calculateStyleScore(outfitItems);
    const noveltyScore = this.calculateNoveltyScore(itemIds);
    const rewearScore = this.calculateRewearScore(outfitItems);
    const costScore = this.calculateCostScore(outfitItems, constraints?.maxCost);
    const totalCost = outfitItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    const wearCount = outfitItems.reduce((sum, item) => sum + (item.wearCount || 0), 0);

    // Calculate weighted score
    const objectives = {
      styleScore,
      novelty: noveltyScore,
      rewear: rewearScore,
      cost: costScore
    };

    const score = this.calculateWeightedScore(objectives);

    return {
      items: itemIds,
      score,
      objectives,
      rationale: this.generateRationale(outfitItems, objectives, constraints),
      metadata: {
        styleScore,
        noveltyScore,
        rewearScore,
        costScore,
        totalCost,
        wearCount
      }
    };
  }

  private calculateStyleScore(items: Array<{
    colors: string[];
    texture: string;
    formality: string;
    category: string;
  }>): number {
    const validation = validateOutfit(items);
    return validation.score;
  }

  private calculateNoveltyScore(itemIds: string[]): number {
    const outfitHash = itemIds.sort().join(',');
    
    if (this.outfitHistory.has(outfitHash)) {
      return 20; // Low novelty for seen combinations
    }

    // Calculate novelty based on item wear frequency
    const avgWearCount = itemIds.reduce((sum, id) => {
      return sum + (this.itemHistory.get(id) || 0);
    }, 0) / itemIds.length;

    // Higher novelty for less worn items
    return Math.max(0, 100 - (avgWearCount * 10));
  }

  private calculateRewearScore(items: Array<{
    lastWorn?: Date;
    wearCount?: number;
  }>): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let rewearScore = 100;

    for (const item of items) {
      if (item.lastWorn && item.lastWorn > thirtyDaysAgo) {
        rewearScore -= 20; // Penalty for recently worn items
      }
      
      if (item.wearCount && item.wearCount > 10) {
        rewearScore -= 10; // Penalty for over-worn items
      }
    }

    return Math.max(0, rewearScore);
  }

  private calculateCostScore(
    items: Array<{ cost?: number }>,
    maxCost?: number
  ): number {
    const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
    
    if (!maxCost) {
      // Default cost scoring based on typical fashion costs
      const avgCost = totalCost / items.length;
      if (avgCost < 50) return 90; // Budget-friendly
      if (avgCost < 100) return 70; // Mid-range
      if (avgCost < 200) return 50; // Premium
      return 30; // Luxury
    }

    // Score based on how close to budget
    const costRatio = totalCost / maxCost;
    if (costRatio <= 0.7) return 100; // Well under budget
    if (costRatio <= 0.9) return 80; // Under budget
    if (costRatio <= 1.0) return 60; // At budget
    return Math.max(0, 100 - (costRatio - 1) * 50); // Over budget penalty
  }

  private calculateWeatherCompatibility(
    items: Array<{ category: string; texture: string }>,
    weather: { temperature: number; precipitation: number }
  ): number {
    let score = 100;

    // Temperature considerations
    if (weather.temperature < 10) {
      // Cold weather - need warm items
      const hasWarmItems = items.some(item => 
        ['outerwear', 'sweaters', 'jackets'].includes(item.category) ||
        ['wool', 'fleece', 'thick'].includes(item.texture)
      );
      if (!hasWarmItems) score -= 40;
    } else if (weather.temperature > 25) {
      // Hot weather - need light items
      const hasLightItems = items.some(item => 
        ['shorts', 'tanks', 'light'].includes(item.texture)
      );
      if (!hasLightItems) score -= 30;
    }

    // Precipitation considerations
    if (weather.precipitation > 0.5) {
      // Rainy weather - need water-resistant items
      const hasWaterResistant = items.some(item => 
        ['outerwear', 'jackets'].includes(item.category) ||
        ['waterproof', 'water-resistant'].includes(item.texture)
      );
      if (!hasWaterResistant) score -= 30;
    }

    return Math.max(0, score);
  }

  private calculateWeightedScore(objectives: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const objective of this.config.objectives) {
      const value = objectives[objective.name] || 0;
      const normalizedValue = (value - objective.minValue) / (objective.maxValue - objective.minValue);
      totalScore += normalizedValue * objective.weight;
      totalWeight += objective.weight;
    }

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  private generateRationale(
    items: Array<{ category: string; formality: string }>,
    objectives: Record<string, number>,
    constraints?: {
      maxCost?: number;
      formality?: string;
      weather?: { temperature: number; precipitation: number };
      occasion?: string;
    }
  ): string {
    const rationales: string[] = [];

    if (objectives.styleScore > 80) {
      rationales.push('Excellent style coordination');
    } else if (objectives.styleScore > 60) {
      rationales.push('Good style balance');
    }

    if (objectives.novelty > 70) {
      rationales.push('Fresh combination');
    }

    if (objectives.rewear > 80) {
      rationales.push('Perfect for rotation');
    }

    if (objectives.cost > 80) {
      rationales.push('Budget-friendly');
    }

    if (constraints?.weather) {
      rationales.push(`Weather-appropriate for ${constraints.weather.temperature}°C`);
    }

    if (constraints?.occasion) {
      rationales.push(`Suitable for ${constraints.occasion}`);
    }

    return rationales.join('. ') + '.';
  }

  private async geneticOptimization(
    initialCandidates: OutfitCandidate[],
    items: Array<{
      id: string;
      colors: string[];
      texture: string;
      formality: string;
      category: string;
      cost?: number;
      lastWorn?: Date;
      wearCount?: number;
    }>,
    constraints?: {
      maxCost?: number;
      formality?: string;
      weather?: { temperature: number; precipitation: number };
      occasion?: string;
    },
    startTime: number
  ): Promise<OutfitCandidate[]> {
    let population = [...initialCandidates];

    for (let generation = 0; generation < this.config.generations; generation++) {
      // Check time limit
      if (Date.now() - startTime > this.config.timeLimit) {
        break;
      }

      // Selection - keep top performers
      population.sort((a, b) => b.score - a.score);
      const elite = population.slice(0, Math.floor(population.length * 0.2));

      // Crossover - create new combinations
      const offspring: OutfitCandidate[] = [];
      for (let i = 0; i < this.config.populationSize - elite.length; i++) {
        const parent1 = elite[Math.floor(Math.random() * elite.length)];
        const parent2 = elite[Math.floor(Math.random() * elite.length)];
        
        const child = this.crossover(parent1, parent2, items);
        if (child) {
          offspring.push(child);
        }
      }

      // Mutation - random changes
      for (const candidate of offspring) {
        if (Math.random() < 0.1) { // 10% mutation rate
          this.mutate(candidate, items);
        }
      }

      // Evaluate new candidates
      const newCandidates: OutfitCandidate[] = [];
      for (const candidate of offspring) {
        const evaluated = await this.evaluateCandidate(candidate.items, items, constraints);
        if (evaluated) {
          newCandidates.push(evaluated);
        }
      }

      // Update population
      population = [...elite, ...newCandidates];
    }

    return population;
  }

  private crossover(
    parent1: OutfitCandidate,
    parent2: OutfitCandidate,
    items: Array<{ id: string; category: string }>
  ): OutfitCandidate | null {
    // Simple crossover: take items from both parents
    const allItems = [...new Set([...parent1.items, ...parent2.items])];
    
    // Ensure we have compatible categories
    const categories = new Set();
    const selectedItems: string[] = [];

    for (const itemId of allItems) {
      const item = items.find(i => i.id === itemId);
      if (item && !categories.has(item.category)) {
        selectedItems.push(itemId);
        categories.add(item.category);
      }
    }

    if (selectedItems.length < 2) return null;

    return {
      items: selectedItems.slice(0, 4), // Max 4 items
      score: 0,
      objectives: {},
      rationale: '',
      metadata: {
        styleScore: 0,
        noveltyScore: 0,
        rewearScore: 0,
        costScore: 0,
        totalCost: 0,
        wearCount: 0
      }
    };
  }

  private mutate(candidate: OutfitCandidate, items: Array<{ id: string; category: string }>) {
    // Random mutation: replace one item
    const availableItems = items.filter(item => !candidate.items.includes(item.id));
    if (availableItems.length > 0) {
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      const randomIndex = Math.floor(Math.random() * candidate.items.length);
      candidate.items[randomIndex] = randomItem.id;
    }
  }

  // Update item wear history
  updateItemHistory(itemId: string): void {
    const currentCount = this.itemHistory.get(itemId) || 0;
    this.itemHistory.set(itemId, currentCount + 1);
  }

  // Update outfit history
  updateOutfitHistory(itemIds: string[]): void {
    const outfitHash = itemIds.sort().join(',');
    this.outfitHistory.add(outfitHash);
  }

  // Reset history (useful for testing)
  resetHistory(): void {
    this.itemHistory.clear();
    this.outfitHistory.clear();
  }
}
