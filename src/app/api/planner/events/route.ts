import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/planner/events');

  const rl = await rateLimit(request as unknown as Request, 'planner_events_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/planner/events');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const events = await db.event.findMany({ where: { userId }, orderBy: { date: 'asc' } });
    span.end();
    return NextResponse.json({ events });
  } catch (error) {
    span.end();
    console.error('events list error', error);
    return NextResponse.json({ error: 'Failed to list events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/planner/events');

  const rl = await rateLimit(request as unknown as Request, 'planner_events_post', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/planner/events');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const body = await request.json();
    const { userId, title, date, location, dressCode } = body;
    if (!userId || !title || !date) {
      return NextResponse.json({ error: 'userId, title, and date are required' }, { status: 400 });
    }

    const event = await db.event.create({
      data: { userId, title, date: new Date(date), location, dressCode }
    });
    span.end();
    return NextResponse.json({ event });
  } catch (error) {
    span.end();
    console.error('event create error', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
