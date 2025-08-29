import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse, secLog } from '@/lib/security-log';

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/gdpr/export');

  const rl = await rateLimit(request as unknown as Request, 'gdpr_export', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/gdpr/export');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId } = body as { userId: string };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    // Fetch all relevant user data
    const user = await db.user.findFirst({ where: { id: userId } });
    const bodyProfile = await db.bodyProfile.findFirst({ where: { userId } });
    const items = await db.item.findMany({ where: { userId } });
    const outfits = await db.outfit.findMany({ where: { userId } });
    const outfitItems = await db.outfitItem.findMany({ where: { outfitId: { in: outfits.map(o => o.id) } } });
    const events = await db.event.findMany({ where: { userId } });
    const audit = await db.auditLog.findMany({ where: { userId } });

    const bundle = {
      generatedAt: new Date().toISOString(),
      user: user || null,
      bodyProfile: bodyProfile || null,
      items,
      outfits,
      outfitItems,
      events,
      audit
    };

    secLog('INFO', 'GDPR export generated', { userId });
    span.end();

    const buf = Buffer.from(JSON.stringify(bundle, null, 2), 'utf-8');
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="gdpr-export.json"'
      }
    });
  } catch (error) {
    span.end();
    console.error('gdpr export error', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
