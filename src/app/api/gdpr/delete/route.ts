import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse, secLog } from '@/lib/security-log';

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/gdpr/delete');

  const rl = await rateLimit(request as unknown as Request, 'gdpr_delete', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/gdpr/delete');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId, confirm } = body as { userId: string; confirm?: boolean };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (!confirm) return NextResponse.json({ error: 'confirm=true is required' }, { status: 400 });

    // Schedule deletion via audit log entry; background job should process within 24h
    await db.auditLog.create({
      data: {
        userId,
        action: 'gdpr.delete.requested',
        target: 'account',
        meta: { requestedAt: new Date().toISOString() } as any
      }
    });

    secLog('WARN', 'GDPR delete requested', { userId });
    span.end();

    return NextResponse.json({
      status: 'scheduled',
      message: 'Your account deletion has been scheduled and will complete within 24 hours.'
    });
  } catch (error) {
    span.end();
    console.error('gdpr delete error', error);
    return NextResponse.json({ error: 'Failed to schedule deletion' }, { status: 500 });
  }
}
