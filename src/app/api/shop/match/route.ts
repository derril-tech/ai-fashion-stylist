import { NextRequest, NextResponse } from 'next/server';
import { retailerService } from '@/lib/retailer-service';
import { monitorAPIRequest } from '@/lib/observability';
import { db } from '@/lib/db';
import { recordRequestMetrics } from '@/lib/metrics';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/shop/match');
  const start = Date.now();
  try {
    const rl = await rateLimit(request as unknown as Request, 'shop_match', RATE_RULES.default);
    if (!rl.allowed) {
      logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/shop/match');
      span.end();
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const itemId = searchParams.get('itemId') || undefined;
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const colors = (searchParams.get('colors') || '').split(',').filter(Boolean);
    const budgetCents = searchParams.get('budgetCents') ? parseInt(searchParams.get('budgetCents')!) : undefined;
    const currency = (searchParams.get('currency') as any) || undefined;

    let attributes: any = { category, brand, colors: colors.length ? colors : undefined, budgetCents };

    if (itemId && userId) {
      const item = await db.item.findFirst({
        where: { id: itemId, userId },
        select: { category: true, brand: true, colors: true }
      });
      if (item) {
        attributes = {
          category: item.category,
          brand: item.brand || brand,
          colors: item.colors || colors,
          budgetCents
        };
      }
    }

    const products = await retailerService.matchProducts({
      userId,
      itemId,
      attributes,
      locale: { currency }
    });

    const status = 200;
    recordRequestMetrics('/api/shop/match', 'GET', status, Date.now() - start);
    span.end();
    return NextResponse.json({ products }, { status });
  } catch (error) {
    const status = 500;
    recordRequestMetrics('/api/shop/match', 'GET', status, Date.now() - start);
    span.end();
    console.error('shop/match error', error);
    return NextResponse.json({ error: 'Failed to match products' }, { status });
  }
}
