import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toICS } from '@/lib/ics';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/planner/export');

  const rl = await rateLimit(request as unknown as Request, 'planner_export', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/planner/export');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const events = await db.event.findMany({
      where: { userId },
      select: { id: true, title: true, date: true, location: true, dressCode: true }
    });

    const ics = toICS(
      events.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.date),
        location: e.location || undefined,
        description: e.dressCode ? `Dress code: ${e.dressCode}` : undefined,
      })),
      'AI Fashion Stylist Planner'
    );

    span.end();
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="planner.ics"'
      }
    });
  } catch (error) {
    span.end();
    console.error('planner export error', error);
    return NextResponse.json({ error: 'Failed to export ICS' }, { status: 500 });
  }
}
