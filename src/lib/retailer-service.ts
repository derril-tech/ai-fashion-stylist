import { monitorAPIRequest } from './observability';

export type Currency = 'USD' | 'EUR' | 'GBP';

export interface RetailerProduct {
  retailer: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  currency: Currency;
  url: string;
  imageUrl: string;
  sizes?: string[];
  colors?: string[];
  availability: {
    inStock: boolean;
    sizeStock?: Record<string, boolean>;
  };
  reason?: string;
  score?: number;
  affiliateUrl?: string;
}

export interface MatchQuery {
  userId?: string;
  itemId?: string;
  attributes?: {
    category?: string;
    colors?: string[];
    brand?: string;
    size?: string;
    budgetCents?: number;
  };
  locale?: {
    country?: string;
    currency?: Currency;
  };
}

export class RetailerService {
  private cache = new Map<string, { products: RetailerProduct[]; expiresAt: number }>();
  private readonly CACHE_MS = 15 * 60 * 1000; // 15 minutes
  private readonly AFFILIATE_ID = process.env.AFFILIATE_ID || 'AFFILIATE_DEMO';

  async matchProducts(query: MatchQuery): Promise<RetailerProduct[]> {
    const span = monitorAPIRequest('RetailerService.matchProducts', '/shop/match');

    const cacheKey = JSON.stringify(query);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      span.end();
      return cached.products;
    }

    // In MVP, use mock retailers; replace with real APIs later
    const products = await this.fetchFromMockRetailers(query);

    // Generate affiliate URLs and adjust currency
    const adjusted = products
      .map(p => ({ ...p, affiliateUrl: this.generateAffiliateUrl(p.url) }))
      .map(p => this.convertCurrencyIfNeeded(p, query.locale?.currency));

    // Rank products (simple score: inStock, brand match, color/category match, price within budget)
    const ranked = this.rankProducts(adjusted, query);

    this.cache.set(cacheKey, { products: ranked, expiresAt: Date.now() + this.CACHE_MS });
    span.end();
    return ranked;
  }

  private async fetchFromMockRetailers(query: MatchQuery): Promise<RetailerProduct[]> {
    const mockDb: RetailerProduct[] = [
      {
        retailer: 'MockRetailerA',
        productId: 'A-001',
        name: 'Classic White Sneakers',
        brand: 'Uniqlo',
        category: 'shoes',
        priceCents: 5999,
        currency: 'USD',
        url: 'https://retailer.example/sneakers-white',
        imageUrl: 'https://images.example/sneakers-white.jpg',
        sizes: ['38', '39', '40', '41'],
        colors: ['white'],
        availability: { inStock: true }
      },
      {
        retailer: 'MockRetailerB',
        productId: 'B-101',
        name: 'Slim Fit Chinos',
        brand: 'Zara',
        category: 'bottoms',
        priceCents: 4599,
        currency: 'USD',
        url: 'https://retailer.example/chinos-slim',
        imageUrl: 'https://images.example/chinos-slim.jpg',
        sizes: ['XS','S','M','L','XL'],
        colors: ['navy','black','khaki'],
        availability: { inStock: true }
      },
      {
        retailer: 'MockRetailerC',
        productId: 'C-777',
        name: 'Waterproof Trench Coat',
        brand: 'H&M',
        category: 'outerwear',
        priceCents: 8999,
        currency: 'USD',
        url: 'https://retailer.example/trench-waterproof',
        imageUrl: 'https://images.example/trench-waterproof.jpg',
        sizes: ['S','M','L'],
        colors: ['beige','black'],
        availability: { inStock: true }
      }
    ];

    // Filter by attributes when provided
    let results = mockDb;
    const a = query.attributes;
    if (a?.category) results = results.filter(p => p.category === a.category);
    if (a?.brand) results = results.filter(p => p.brand.toLowerCase() === a.brand.toLowerCase());
    if (a?.colors && a.colors.length)
      results = results.filter(p => (p.colors || []).some(c => a.colors!.includes(c)));
    if (a?.budgetCents)
      results = results.filter(p => p.priceCents <= a.budgetCents!);

    return results;
  }

  private generateAffiliateUrl(url: string): string {
    const u = new URL(url);
    u.searchParams.set('aff_id', this.AFFILIATE_ID);
    return u.toString();
  }

  private convertCurrencyIfNeeded(product: RetailerProduct, target?: Currency): RetailerProduct {
    if (!target || target === product.currency) return product;
    const rate = this.getFxRate(product.currency, target);
    return {
      ...product,
      priceCents: Math.round(product.priceCents * rate),
      currency: target
    };
  }

  private getFxRate(from: Currency, to: Currency): number {
    const table: Record<Currency, Record<Currency, number>> = {
      USD: { USD: 1, EUR: 0.92, GBP: 0.78 },
      EUR: { USD: 1.09, EUR: 1, GBP: 0.85 },
      GBP: { USD: 1.28, EUR: 1.18, GBP: 1 }
    };
    return table[from][to] || 1;
  }

  private rankProducts(products: RetailerProduct[], query: MatchQuery): RetailerProduct[] {
    const a = query.attributes;
    return products
      .map(p => {
        let score = 0;
        if (p.availability.inStock) score += 50;
        if (a?.brand && p.brand.toLowerCase() === a.brand.toLowerCase()) score += 10;
        if (a?.category && p.category === a.category) score += 15;
        if (a?.colors && (p.colors || []).some(c => a.colors!.includes(c))) score += 10;
        if (a?.budgetCents && p.priceCents <= a.budgetCents) score += 10;
        return { ...p, score } as RetailerProduct;
      })
      .sort((x, y) => (y.score || 0) - (x.score || 0));
  }
}

export const retailerService = new RetailerService();
