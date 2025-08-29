import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHousehold, validateHouseholdAccess, HOUSEHOLD_LIMITS } from '@/lib/household';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/households');

  const rl = await rateLimit(request as unknown as Request, 'households_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/households');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get households where user is a member
    const households = await db.household.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        items: {
          select: { id: true, title: true, category: true },
          take: 5 // Preview of items
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    span.end();
    return NextResponse.json({ households });
  } catch (error) {
    span.end();
    console.error('Error fetching households:', error);
    return NextResponse.json({ error: 'Failed to fetch households' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/households');

  const rl = await rateLimit(request as unknown as Request, 'households_post', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/households');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'name and ownerId are required' }, { status: 400 });
    }

    // Check household limits
    const existingHouseholds = await db.household.count({
      where: { ownerId }
    });

    if (existingHouseholds >= HOUSEHOLD_LIMITS.MAX_HOUSEHOLDS_PER_USER) {
      return NextResponse.json({ 
        error: `Maximum ${HOUSEHOLD_LIMITS.MAX_HOUSEHOLDS_PER_USER} households per user` 
      }, { status: 400 });
    }

    const household = await db.household.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'owner'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    span.end();
    return NextResponse.json({ household });
  } catch (error) {
    span.end();
    console.error('Error creating household:', error);
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}
