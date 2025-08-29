import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCapsule, generateShareCode } from '@/lib/creator-mode';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/capsules');
  const start = Date.now();

  const rl = await rateLimit(request as unknown as Request, 'capsules_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/capsules');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('public') === 'true';

    if (!userId && !isPublic) {
      return NextResponse.json({ error: 'userId required for private capsules' }, { status: 400 });
    }

    const where = isPublic ? { isPublic: true } : { userId };
    
    const capsules = await db.capsule.findMany({
      where,
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                title: true,
                category: true,
                colors: true,
                imageS3: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    span.end();
    return NextResponse.json({ capsules });
  } catch (error) {
    span.end();
    console.error('Error fetching capsules:', error);
    return NextResponse.json({ error: 'Failed to fetch capsules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/capsules');
  const start = Date.now();

  const rl = await rateLimit(request as unknown as Request, 'capsules_post', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/capsules');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId, name, description, isPublic = false, itemIds } = body;

    if (!userId || !name || !itemIds || !Array.isArray(itemIds)) {
      return NextResponse.json({ 
        error: 'userId, name, and itemIds array are required' 
      }, { status: 400 });
    }

    // Verify user owns all items
    const items = await db.item.findMany({
      where: { id: { in: itemIds }, userId },
      select: { id: true }
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json({ 
        error: 'Some items not found or not accessible' 
      }, { status: 404 });
    }

    const capsule = await db.capsule.create({
      data: {
        userId,
        name,
        description,
        isPublic,
        shareCode: isPublic ? generateShareCode() : null,
        items: {
          create: itemIds.map((itemId: string, index: number) => ({
            itemId,
            order: index
          }))
        }
      },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                title: true,
                category: true,
                colors: true,
                imageS3: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    span.end();
    return NextResponse.json({ capsule });
  } catch (error) {
    span.end();
    console.error('Error creating capsule:', error);
    return NextResponse.json({ error: 'Failed to create capsule' }, { status: 500 });
  }
}
