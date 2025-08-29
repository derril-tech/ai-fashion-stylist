import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateSustainabilityScore, getSustainabilityFilters } from '@/lib/sustainability';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/sustainability');

  const rl = await rateLimit(request as unknown as Request, 'sustainability_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/sustainability');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'filters') {
      const filters = getSustainabilityFilters();
      span.end();
      return NextResponse.json({ filters });
    }

    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user's items with sustainability data
    const items = await db.item.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        sustainabilityScore: true,
        sustainabilityBadges: true
      }
    });

    // Calculate overall sustainability metrics
    const scores = items
      .filter(item => item.sustainabilityScore !== null)
      .map(item => item.sustainabilityScore!);
    
    const avgScore = scores.length > 0 ? 
      scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const badgeCount = items.reduce((acc, item) => {
      (item.sustainabilityBadges || []).forEach(badge => {
        acc[badge] = (acc[badge] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    span.end();
    return NextResponse.json({
      items,
      metrics: {
        averageScore: Math.round(avgScore),
        totalItems: items.length,
        scoredItems: scores.length,
        badgeDistribution: badgeCount
      }
    });
  } catch (error) {
    span.end();
    console.error('Error fetching sustainability data:', error);
    return NextResponse.json({ error: 'Failed to fetch sustainability data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/sustainability');

  const rl = await rateLimit(request as unknown as Request, 'sustainability_post', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/sustainability');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId, itemId, recalculate = false } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'userId and itemId are required' }, { status: 400 });
    }

    const item = await db.item.findFirst({
      where: { id: itemId, userId },
      select: {
        id: true,
        brand: true,
        fabric: true,
        category: true,
        colors: true,
        sustainabilityScore: true,
        sustainabilityBadges: true
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Calculate or recalculate sustainability score
    if (!item.sustainabilityScore || recalculate) {
      const metrics = calculateSustainabilityScore({
        brand: item.brand,
        fabric: item.fabric,
        category: item.category,
        colors: item.colors
      });

      const updatedItem = await db.item.update({
        where: { id: itemId },
        data: {
          sustainabilityScore: metrics.score,
          sustainabilityBadges: metrics.badges
        },
        select: {
          id: true,
          sustainabilityScore: true,
          sustainabilityBadges: true
        }
      });

      span.end();
      return NextResponse.json({ 
        item: updatedItem,
        metrics: {
          score: metrics.score,
          badges: metrics.badges,
          factors: metrics.factors
        }
      });
    }

    span.end();
    return NextResponse.json({ 
      item: {
        id: item.id,
        sustainabilityScore: item.sustainabilityScore,
        sustainabilityBadges: item.sustainabilityBadges
      }
    });
  } catch (error) {
    span.end();
    console.error('Error processing sustainability request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
