import { monitorImageProcessing } from './observability';

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  notifiedAt?: Date;
  createdAt: Date;
}

export interface PriceHistory {
  id: string;
  productId: string;
  priceCents: number;
  currency: string;
  timestamp: Date;
}

export interface PriceAnalysis {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChange: number; // percentage
  trend: 'up' | 'down' | 'stable';
  recommendation: 'buy' | 'wait' | 'monitor';
}

export async function analyzePriceHistory(
  priceHistory: PriceHistory[]
): Promise<PriceAnalysis> {
  const span = monitorImageProcessing('analyzePriceHistory', { dataPoints: priceHistory.length });
  
  if (priceHistory.length === 0) {
    throw new Error('No price history available');
  }

  // Sort by timestamp
  const sorted = priceHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  const prices = sorted.map(p => p.priceCents);
  const currentPrice = prices[prices.length - 1];
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Calculate trend (last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentPrices = sorted.filter(p => p.timestamp >= sevenDaysAgo).map(p => p.priceCents);
  const previousPrices = sorted.filter(p => 
    p.timestamp >= fourteenDaysAgo && p.timestamp < sevenDaysAgo
  ).map(p => p.priceCents);

  let priceChange = 0;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (recentPrices.length > 0 && previousPrices.length > 0) {
    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const previousAvg = previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;
    
    priceChange = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (priceChange > 5) trend = 'up';
    else if (priceChange < -5) trend = 'down';
    else trend = 'stable';
  }

  // Generate recommendation
  let recommendation: 'buy' | 'wait' | 'monitor' = 'monitor';
  
  const priceRatio = currentPrice / lowestPrice;
  if (priceRatio <= 1.1) {
    recommendation = 'buy'; // Within 10% of lowest price
  } else if (priceRatio >= 1.5) {
    recommendation = 'wait'; // 50% above lowest price
  }

  span.end();

  return {
    currentPrice,
    lowestPrice,
    highestPrice,
    averagePrice: Math.round(averagePrice),
    priceChange: Math.round(priceChange * 100) / 100,
    trend,
    recommendation
  };
}

export function shouldTriggerAlert(
  alert: PriceAlert,
  currentPrice: number
): boolean {
  if (!alert.isActive) return false;
  if (alert.notifiedAt && Date.now() - alert.notifiedAt.getTime() < 24 * 60 * 60 * 1000) {
    return false; // Don't spam - wait 24h between notifications
  }
  
  return currentPrice <= alert.targetPrice;
}

export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export function getPriceRecommendationMessage(
  analysis: PriceAnalysis,
  productName: string
): string {
  switch (analysis.recommendation) {
    case 'buy':
      return `Great time to buy ${productName}! Price is near its lowest point.`;
    case 'wait':
      return `Consider waiting on ${productName}. Price is significantly above average.`;
    case 'monitor':
      return `Keep monitoring ${productName}. Price is stable but could change.`;
    default:
      return `Monitor ${productName} for price changes.`;
  }
}

export async function createPriceAlert(data: {
  userId: string;
  productId: string;
  targetPrice: number;
  currency: string;
}): Promise<PriceAlert> {
  const span = monitorImageProcessing('createPriceAlert', { productId: data.productId });
  
  const alert: PriceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId,
    productId: data.productId,
    targetPrice: data.targetPrice,
    currency: data.currency,
    isActive: true,
    createdAt: new Date()
  };

  span.end();
  return alert;
}

export function getBackInStockMessage(productName: string): string {
  return `${productName} is back in stock! Don't miss out - check it out now.`;
}
