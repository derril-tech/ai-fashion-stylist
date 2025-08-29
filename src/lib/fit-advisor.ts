import { monitorImageProcessing } from './observability';

export interface BodyProfile {
  height: number; // cm
  weight: number; // kg
  bust: number; // cm
  waist: number; // cm
  hips: number; // cm
  inseam: number; // cm
  shoulder: number; // cm
  armLength: number; // cm
  shoeSize: number; // EU size
  bodyType: 'hourglass' | 'rectangle' | 'triangle' | 'inverted-triangle' | 'oval';
  measurements?: {
    neck: number;
    bicep: number;
    thigh: number;
    calf: number;
  };
}

export interface SizeRecommendation {
  brand: string;
  recommendedSize: string;
  confidence: number; // 0-100
  fitNotes: string[];
  alternatives: string[];
  measurements: {
    bust?: number;
    waist?: number;
    hips?: number;
    length?: number;
  };
}

export interface SilhouetteTip {
  category: string;
  tip: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  bodyTypes: string[];
}

export interface FitAnalysis {
  overallFit: number; // 0-100
  recommendations: SizeRecommendation[];
  silhouetteTips: SilhouetteTip[];
  fitIssues: string[];
  confidence: number; // 0-100
}

// Brand size mapping database
export const BRAND_SIZE_MAPS: Record<string, Record<string, any>> = {
  'zara': {
    'tops': {
      'XS': { bust: 80, waist: 64, hips: 88 },
      'S': { bust: 84, waist: 68, hips: 92 },
      'M': { bust: 88, waist: 72, hips: 96 },
      'L': { bust: 92, waist: 76, hips: 100 },
      'XL': { bust: 96, waist: 80, hips: 104 }
    },
    'bottoms': {
      'XS': { waist: 64, hips: 88, inseam: 76 },
      'S': { waist: 68, hips: 92, inseam: 78 },
      'M': { waist: 72, hips: 96, inseam: 80 },
      'L': { waist: 76, hips: 100, inseam: 82 },
      'XL': { waist: 80, hips: 104, inseam: 84 }
    }
  },
  'h&m': {
    'tops': {
      'XS': { bust: 82, waist: 66, hips: 90 },
      'S': { bust: 86, waist: 70, hips: 94 },
      'M': { bust: 90, waist: 74, hips: 98 },
      'L': { bust: 94, waist: 78, hips: 102 },
      'XL': { bust: 98, waist: 82, hips: 106 }
    },
    'bottoms': {
      'XS': { waist: 66, hips: 90, inseam: 77 },
      'S': { waist: 70, hips: 94, inseam: 79 },
      'M': { waist: 74, hips: 98, inseam: 81 },
      'L': { waist: 78, hips: 102, inseam: 83 },
      'XL': { waist: 82, hips: 106, inseam: 85 }
    }
  },
  'uniqlo': {
    'tops': {
      'XS': { bust: 78, waist: 62, hips: 86 },
      'S': { bust: 82, waist: 66, hips: 90 },
      'M': { bust: 86, waist: 70, hips: 94 },
      'L': { bust: 90, waist: 74, hips: 98 },
      'XL': { bust: 94, waist: 78, hips: 102 }
    },
    'bottoms': {
      'XS': { waist: 62, hips: 86, inseam: 75 },
      'S': { waist: 66, hips: 90, inseam: 77 },
      'M': { waist: 70, hips: 94, inseam: 79 },
      'L': { waist: 74, hips: 98, inseam: 81 },
      'XL': { waist: 78, hips: 102, inseam: 83 }
    }
  },
  'nike': {
    'tops': {
      'XS': { bust: 80, waist: 64, hips: 88 },
      'S': { bust: 84, waist: 68, hips: 92 },
      'M': { bust: 88, waist: 72, hips: 96 },
      'L': { bust: 92, waist: 76, hips: 100 },
      'XL': { bust: 96, waist: 80, hips: 104 }
    },
    'bottoms': {
      'XS': { waist: 64, hips: 88, inseam: 76 },
      'S': { waist: 68, hips: 92, inseam: 78 },
      'M': { waist: 72, hips: 96, inseam: 80 },
      'L': { waist: 76, hips: 100, inseam: 82 },
      'XL': { waist: 80, hips: 104, inseam: 84 }
    }
  }
};

// Silhouette tips database
export const SILHOUETTE_TIPS: SilhouetteTip[] = [
  // Hourglass body type tips
  {
    category: 'tops',
    tip: 'Choose fitted tops that highlight your waist',
    reasoning: 'Emphasizes natural curves and creates balanced proportions',
    priority: 'high',
    bodyTypes: ['hourglass']
  },
  {
    category: 'tops',
    tip: 'Avoid boxy or oversized tops',
    reasoning: 'Can hide your natural waist definition',
    priority: 'medium',
    bodyTypes: ['hourglass']
  },
  {
    category: 'bottoms',
    tip: 'High-waisted pants and skirts work well',
    reasoning: 'Accentuates your waist and creates flattering proportions',
    priority: 'high',
    bodyTypes: ['hourglass']
  },
  {
    category: 'dresses',
    tip: 'Wrap dresses and fit-and-flare styles are ideal',
    reasoning: 'Follows your natural curves and highlights your waist',
    priority: 'high',
    bodyTypes: ['hourglass']
  },

  // Rectangle body type tips
  {
    category: 'tops',
    tip: 'Add volume and texture to create curves',
    reasoning: 'Creates the illusion of curves and adds dimension',
    priority: 'high',
    bodyTypes: ['rectangle']
  },
  {
    category: 'tops',
    tip: 'Try peplum tops and ruffled details',
    reasoning: 'Adds volume at the waist and hips',
    priority: 'medium',
    bodyTypes: ['rectangle']
  },
  {
    category: 'bottoms',
    tip: 'Choose pants with side pockets or embellishments',
    reasoning: 'Adds volume to hips and creates curves',
    priority: 'medium',
    bodyTypes: ['rectangle']
  },
  {
    category: 'dresses',
    tip: 'A-line and empire waist dresses work well',
    reasoning: 'Creates the illusion of curves and defines the waist',
    priority: 'high',
    bodyTypes: ['rectangle']
  },

  // Triangle body type tips
  {
    category: 'tops',
    tip: 'Choose tops with wider shoulders or boat necks',
    reasoning: 'Balances wider hips by adding width to shoulders',
    priority: 'high',
    bodyTypes: ['triangle']
  },
  {
    category: 'tops',
    tip: 'Avoid tight-fitting tops around the hips',
    reasoning: 'Can emphasize the wider hip area',
    priority: 'medium',
    bodyTypes: ['triangle']
  },
  {
    category: 'bottoms',
    tip: 'Dark-colored bottoms help minimize hips',
    reasoning: 'Dark colors have a slimming effect',
    priority: 'medium',
    bodyTypes: ['triangle']
  },
  {
    category: 'dresses',
    tip: 'Empire waist and A-line dresses are flattering',
    reasoning: 'Draws attention upward and balances proportions',
    priority: 'high',
    bodyTypes: ['triangle']
  },

  // Inverted triangle body type tips
  {
    category: 'tops',
    tip: 'Choose V-necks and scoop necks',
    reasoning: 'Creates vertical lines and balances broad shoulders',
    priority: 'high',
    bodyTypes: ['inverted-triangle']
  },
  {
    category: 'tops',
    tip: 'Avoid shoulder pads and wide necklines',
    reasoning: 'Can make shoulders appear even broader',
    priority: 'medium',
    bodyTypes: ['inverted-triangle']
  },
  {
    category: 'bottoms',
    tip: 'Choose bottoms with volume and patterns',
    reasoning: 'Adds visual weight to the lower body',
    priority: 'high',
    bodyTypes: ['inverted-triangle']
  },
  {
    category: 'dresses',
    tip: 'Wrap dresses and fit-and-flare styles work well',
    reasoning: 'Adds volume to hips and creates balance',
    priority: 'high',
    bodyTypes: ['inverted-triangle']
  },

  // Oval body type tips
  {
    category: 'tops',
    tip: 'Choose structured tops with defined shoulders',
    reasoning: 'Creates structure and definition',
    priority: 'high',
    bodyTypes: ['oval']
  },
  {
    category: 'tops',
    tip: 'Avoid oversized or shapeless tops',
    reasoning: 'Can add bulk and hide your natural shape',
    priority: 'medium',
    bodyTypes: ['oval']
  },
  {
    category: 'bottoms',
    tip: 'High-waisted pants with structure work well',
    reasoning: 'Creates definition and elongates the legs',
    priority: 'high',
    bodyTypes: ['oval']
  },
  {
    category: 'dresses',
    tip: 'Structured dresses with defined waistlines',
    reasoning: 'Creates shape and definition',
    priority: 'high',
    bodyTypes: ['oval']
  }
];

export class FitAdvisor {
  private bodyProfile: BodyProfile | null = null;

  constructor(bodyProfile?: BodyProfile) {
    if (bodyProfile) {
      this.bodyProfile = bodyProfile;
    }
  }

  setBodyProfile(profile: BodyProfile): void {
    this.bodyProfile = profile;
  }

  async analyzeFit(
    item: {
      brand: string;
      category: string;
      currentSize: string;
      measurements?: {
        bust?: number;
        waist?: number;
        hips?: number;
        length?: number;
      };
    }
  ): Promise<FitAnalysis> {
    const span = monitorImageProcessing('analyzeFit', { 
      brand: item.brand, 
      category: item.category 
    });

    if (!this.bodyProfile) {
      throw new Error('Body profile not set. Please set body profile first.');
    }

    const recommendations = this.getSizeRecommendations(item);
    const silhouetteTips = this.getSilhouetteTips(item.category);
    const fitIssues = this.identifyFitIssues(item);
    const overallFit = this.calculateOverallFit(item, recommendations);
    const confidence = this.calculateConfidence(item, recommendations);

    span.end();

    return {
      overallFit,
      recommendations,
      silhouetteTips,
      fitIssues,
      confidence
    };
  }

  private getSizeRecommendations(item: {
    brand: string;
    category: string;
    currentSize: string;
    measurements?: {
      bust?: number;
      waist?: number;
      hips?: number;
      length?: number;
    };
  }): SizeRecommendation[] {
    const brandMap = BRAND_SIZE_MAPS[item.brand.toLowerCase()];
    if (!brandMap) {
      return [{
        brand: item.brand,
        recommendedSize: item.currentSize,
        confidence: 50,
        fitNotes: ['Brand size chart not available'],
        alternatives: [],
        measurements: {}
      }];
    }

    const categoryMap = brandMap[item.category];
    if (!categoryMap) {
      return [{
        brand: item.brand,
        recommendedSize: item.currentSize,
        confidence: 60,
        fitNotes: ['Category size chart not available'],
        alternatives: [],
        measurements: {}
      }];
    }

    const recommendations: SizeRecommendation[] = [];
    const userMeasurements = this.getRelevantMeasurements(item.category);

    // Find best matching size
    let bestSize = item.currentSize;
    let bestFit = 100;
    let bestMeasurements = {};

    for (const [size, measurements] of Object.entries(categoryMap)) {
      const fitScore = this.calculateSizeFit(userMeasurements, measurements);
      
      if (fitScore < bestFit) {
        bestFit = fitScore;
        bestSize = size;
        bestMeasurements = measurements;
      }

      recommendations.push({
        brand: item.brand,
        recommendedSize: size,
        confidence: Math.max(0, 100 - fitScore),
        fitNotes: this.generateFitNotes(userMeasurements, measurements),
        alternatives: this.getAlternativeSizes(size, categoryMap),
        measurements
      });
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  }

  private getRelevantMeasurements(category: string): Record<string, number> {
    if (!this.bodyProfile) return {};

    switch (category) {
      case 'tops':
        return {
          bust: this.bodyProfile.bust,
          waist: this.bodyProfile.waist,
          shoulder: this.bodyProfile.shoulder
        };
      case 'bottoms':
        return {
          waist: this.bodyProfile.waist,
          hips: this.bodyProfile.hips,
          inseam: this.bodyProfile.inseam
        };
      case 'dresses':
        return {
          bust: this.bodyProfile.bust,
          waist: this.bodyProfile.waist,
          hips: this.bodyProfile.hips
        };
      default:
        return {
          bust: this.bodyProfile.bust,
          waist: this.bodyProfile.waist,
          hips: this.bodyProfile.hips
        };
    }
  }

  private calculateSizeFit(
    userMeasurements: Record<string, number>,
    sizeMeasurements: Record<string, number>
  ): number {
    let totalDifference = 0;
    let measurementCount = 0;

    for (const [key, userValue] of Object.entries(userMeasurements)) {
      const sizeValue = sizeMeasurements[key];
      if (sizeValue !== undefined) {
        const difference = Math.abs(userValue - sizeValue);
        totalDifference += difference;
        measurementCount++;
      }
    }

    return measurementCount > 0 ? totalDifference / measurementCount : 100;
  }

  private generateFitNotes(
    userMeasurements: Record<string, number>,
    sizeMeasurements: Record<string, number>
  ): string[] {
    const notes: string[] = [];

    for (const [key, userValue] of Object.entries(userMeasurements)) {
      const sizeValue = sizeMeasurements[key];
      if (sizeValue !== undefined) {
        const difference = userValue - sizeValue;
        
        if (Math.abs(difference) <= 2) {
          notes.push(`${key} fits perfectly`);
        } else if (difference > 2) {
          notes.push(`${key} may be too tight (${Math.round(difference)}cm larger needed)`);
        } else {
          notes.push(`${key} may be too loose (${Math.round(Math.abs(difference))}cm smaller needed)`);
        }
      }
    }

    return notes;
  }

  private getAlternativeSizes(
    currentSize: string,
    sizeMap: Record<string, any>
  ): string[] {
    const sizes = Object.keys(sizeMap);
    const currentIndex = sizes.indexOf(currentSize);
    
    if (currentIndex === -1) return [];

    const alternatives: string[] = [];
    
    // Add one size up and down
    if (currentIndex > 0) {
      alternatives.push(sizes[currentIndex - 1]);
    }
    if (currentIndex < sizes.length - 1) {
      alternatives.push(sizes[currentIndex + 1]);
    }

    return alternatives;
  }

  private getSilhouetteTips(category: string): SilhouetteTip[] {
    if (!this.bodyProfile) return [];

    return SILHOUETTE_TIPS.filter(tip => 
      tip.category === category && 
      tip.bodyTypes.includes(this.bodyProfile!.bodyType)
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private identifyFitIssues(item: {
    brand: string;
    category: string;
    currentSize: string;
    measurements?: {
      bust?: number;
      waist?: number;
      hips?: number;
      length?: number;
    };
  }): string[] {
    const issues: string[] = [];

    if (!this.bodyProfile) return issues;

    // Check for common fit issues based on body type
    switch (this.bodyProfile.bodyType) {
      case 'hourglass':
        if (item.category === 'tops' && item.measurements?.bust) {
          if (Math.abs(this.bodyProfile.bust - item.measurements.bust) > 5) {
            issues.push('Top may not fit properly around bust area');
          }
        }
        break;
      
      case 'triangle':
        if (item.category === 'bottoms' && item.measurements?.hips) {
          if (Math.abs(this.bodyProfile.hips - item.measurements.hips) > 5) {
            issues.push('Bottoms may be too tight around hips');
          }
        }
        break;
      
      case 'inverted-triangle':
        if (item.category === 'tops' && item.measurements?.bust) {
          if (Math.abs(this.bodyProfile.bust - item.measurements.bust) > 5) {
            issues.push('Top may be too tight around shoulders/bust');
          }
        }
        break;
      
      case 'rectangle':
        if (item.category === 'tops' && item.measurements?.waist) {
          if (Math.abs(this.bodyProfile.waist - item.measurements.waist) > 3) {
            issues.push('Top may not define waist properly');
          }
        }
        break;
      
      case 'oval':
        if (item.category === 'tops' && item.measurements?.bust) {
          if (Math.abs(this.bodyProfile.bust - item.measurements.bust) > 5) {
            issues.push('Top may not provide enough structure');
          }
        }
        break;
    }

    return issues;
  }

  private calculateOverallFit(
    item: {
      brand: string;
      category: string;
      currentSize: string;
      measurements?: {
        bust?: number;
        waist?: number;
        hips?: number;
        length?: number;
      };
    },
    recommendations: SizeRecommendation[]
  ): number {
    if (recommendations.length === 0) return 50;

    const bestRecommendation = recommendations[0];
    let fitScore = bestRecommendation.confidence;

    // Adjust based on body type compatibility
    if (this.bodyProfile) {
      const bodyTypeBonus = this.getBodyTypeFitBonus(item.category);
      fitScore += bodyTypeBonus;
    }

    // Adjust based on brand familiarity
    const brandBonus = this.getBrandFitBonus(item.brand);
    fitScore += brandBonus;

    return Math.min(100, Math.max(0, fitScore));
  }

  private getBodyTypeFitBonus(category: string): number {
    if (!this.bodyProfile) return 0;

    const relevantTips = this.getSilhouetteTips(category);
    const highPriorityTips = relevantTips.filter(tip => tip.priority === 'high');
    
    // Bonus for having good silhouette tips available
    return highPriorityTips.length * 5;
  }

  private getBrandFitBonus(brand: string): number {
    // Brands with better size consistency get a bonus
    const brandConsistency: Record<string, number> = {
      'uniqlo': 10,
      'zara': 5,
      'h&m': 0,
      'nike': 8
    };

    return brandConsistency[brand.toLowerCase()] || 0;
  }

  private calculateConfidence(
    item: {
      brand: string;
      category: string;
      currentSize: string;
      measurements?: {
        bust?: number;
        waist?: number;
        hips?: number;
        length?: number;
      };
    },
    recommendations: SizeRecommendation[]
  ): number {
    let confidence = 70; // Base confidence

    // Increase confidence if we have brand size data
    if (BRAND_SIZE_MAPS[item.brand.toLowerCase()]) {
      confidence += 15;
    }

    // Increase confidence if we have measurements
    if (item.measurements && Object.keys(item.measurements).length > 0) {
      confidence += 10;
    }

    // Increase confidence if recommendations are consistent
    if (recommendations.length > 1) {
      const topRecommendations = recommendations.slice(0, 3);
      const avgConfidence = topRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / topRecommendations.length;
      confidence += (avgConfidence - 70) * 0.2;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  // Get general fit advice for body type
  getGeneralFitAdvice(): SilhouetteTip[] {
    if (!this.bodyProfile) return [];

    return SILHOUETTE_TIPS.filter(tip => 
      tip.bodyTypes.includes(this.bodyProfile!.bodyType)
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Calculate body type from measurements
  static calculateBodyType(profile: BodyProfile): string {
    const bustWaistRatio = profile.bust / profile.waist;
    const waistHipRatio = profile.waist / profile.hips;
    const shoulderHipRatio = profile.shoulder / profile.hips;

    // Simple body type classification
    if (bustWaistRatio > 1.1 && waistHipRatio < 0.85) {
      return 'hourglass';
    } else if (Math.abs(bustWaistRatio - 1) < 0.1 && Math.abs(waistHipRatio - 1) < 0.1) {
      return 'rectangle';
    } else if (waistHipRatio > 0.85) {
      return 'triangle';
    } else if (shoulderHipRatio > 1.05) {
      return 'inverted-triangle';
    } else {
      return 'oval';
    }
  }
}
