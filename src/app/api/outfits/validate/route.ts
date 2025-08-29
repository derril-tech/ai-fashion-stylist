import { NextRequest, NextResponse } from 'next/server';
import { validateOutfit } from '@/lib/outfit-rules';
import { monitorAPIRequest } from '@/lib/observability';
import { db } from '@/lib/db';
import { recordRequestMetrics } from '@/lib/metrics';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/outfits/validate');
  const start = Date.now();

  const rl = await rateLimit(request as unknown as Request, 'outfits_validate', RATE_RULES.bursty);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/outfits/validate');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const body = await request.json();
    const { itemIds, userId } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 item IDs are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get item details from database
    const items = await db.item.findMany({
      where: {
        id: { in: itemIds },
        userId
      },
      select: {
        id: true,
        title: true,
        category: true,
        colors: true,
        texture: true,
        formality: true,
        brand: true
      }
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Some items not found or not accessible' },
        { status: 404 }
      );
    }

    // Validate outfit using rules engine
    const validation = validateOutfit(items.map(item => ({
      colors: item.colors,
      texture: item.texture,
      formality: item.formality,
      category: item.category
    })));

    // Add item details to response
    const validationWithItems = {
      ...validation,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        brand: item.brand,
        category: item.category,
        colors: item.colors,
        texture: item.texture,
        formality: item.formality
      }))
    };

    const status = 200;
    recordRequestMetrics('/api/outfits/validate', 'POST', status, Date.now() - start);
    span.end();

    return NextResponse.json(validationWithItems, { status });

  } catch (error) {
    const status = 500;
    recordRequestMetrics('/api/outfits/validate', 'POST', status, Date.now() - start);
    span.end();
    console.error('Error validating outfit:', error);
    
    return NextResponse.json(
      { error: 'Failed to validate outfit' },
      { status }
    );
  }
}
