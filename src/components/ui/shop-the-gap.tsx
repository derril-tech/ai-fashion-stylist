'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  retailer: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  currency: string;
  url: string;
  imageUrl: string;
  sizes?: string[];
  colors?: string[];
  availability: { inStock: boolean };
  affiliateUrl?: string;
  score?: number;
}

interface ShopTheGapProps {
  userId: string;
  itemId?: string;
  category?: string;
  brand?: string;
  colors?: string[];
  budgetCents?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
}

export function ShopTheGap({ userId, itemId, category, brand, colors, budgetCents, currency = 'USD' }: ShopTheGapProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, itemId, category, brand, JSON.stringify(colors), budgetCents, currency]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('userId', userId);
      if (itemId) params.set('itemId', itemId);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (colors && colors.length) params.set('colors', colors.join(','));
      if (budgetCents) params.set('budgetCents', String(budgetCents));
      if (currency) params.set('currency', currency);

      const res = await fetch(`/api/shop/match?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, curr: string) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5" />
          <span>Shop the Gap</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-600">No matching products found right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.slice(0, 9).map((p) => (
              <div key={`${p.retailer}-${p.productId}`} className="border rounded-lg p-3">
                <div className="w-full h-36 bg-gray-100 rounded mb-2" />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate max-w-[70%]" title={p.name}>{p.name}</span>
                  {typeof p.score === 'number' && (
                    <Badge variant="outline">{Math.round(p.score)}%</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">{p.brand} • {p.category}</p>
                <p className="text-sm font-medium mb-2">{formatPrice(p.priceCents, p.currency)}</p>
                <Button asChild className="w-full">
                  <a href={p.affiliateUrl || p.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
