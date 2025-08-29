import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateLookbookJSON, generateLookbookPDF, getThemePreset } from '@/lib/export-service';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/exports/lookbook');

  const rl = await rateLimit(request as unknown as Request, 'exports_lookbook', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/exports/lookbook');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId, outfitIds, outfits, format = 'pdf', theme = 'modern' } = body as {
      userId: string;
      outfitIds?: string[];
      outfits?: Array<{ id: string; name: string; rationale?: string; items: string[] }>;
      format?: 'pdf' | 'json';
      theme?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const themePreset = getThemePreset(theme);

    // Build lookbook outfits
    let lookbookOutfits: any[] = [];

    if (outfits && outfits.length) {
      // Resolve item IDs to details
      const allItemIds = Array.from(new Set(outfits.flatMap((o) => o.items)));
      const items = await db.item.findMany({
        where: { userId, id: { in: allItemIds } },
        select: { id: true, title: true, brand: true, category: true, colors: true, imageUrl: true }
      });
      const itemMap = new Map(items.map((i) => [i.id, i]));
      lookbookOutfits = outfits.map((o) => ({
        id: o.id,
        name: o.name,
        rationale: o.rationale,
        items: o.items.map((id) => itemMap.get(id)).filter(Boolean)
      }));
    } else if (outfitIds && outfitIds.length) {
      // Fetch outfits from DB if schema exists
      const outfitRows = await db.outfit.findMany({
        where: { userId, id: { in: outfitIds } },
        select: { id: true, name: true, rationale: true }
      });
      const outfitItemRows = await db.outfitItem.findMany({
        where: { outfitId: { in: outfitIds } },
        select: { outfitId: true, itemId: true }
      });
      const itemIds = Array.from(new Set(outfitItemRows.map((r) => r.itemId)));
      const items = await db.item.findMany({
        where: { userId, id: { in: itemIds } },
        select: { id: true, title: true, brand: true, category: true, colors: true, imageUrl: true }
      });
      const itemsById = new Map(items.map((i) => [i.id, i]));
      const itemsByOutfit = new Map<string, any[]>(outfitIds.map((id) => [id, []]));
      for (const row of outfitItemRows) {
        const it = itemsById.get(row.itemId);
        if (it) itemsByOutfit.get(row.outfitId)!.push(it);
      }
      lookbookOutfits = outfitRows.map((o) => ({
        id: o.id,
        name: o.name,
        rationale: (o as any).rationale,
        items: itemsByOutfit.get(o.id) || []
      }));
    } else {
      return NextResponse.json({ error: 'Provide outfits or outfitIds' }, { status: 400 });
    }

    if (format === 'json') {
      const buf = await generateLookbookJSON(lookbookOutfits as any, themePreset);
      span.end();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="lookbook.json"'
        }
      });
    }

    const buf = await generateLookbookPDF(lookbookOutfits as any, themePreset);
    span.end();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="lookbook.pdf"'
      }
    });
  } catch (error) {
    span.end();
    console.error('lookbook export error', error);
    return NextResponse.json({ error: 'Failed to export lookbook' }, { status: 500 });
  }
}
