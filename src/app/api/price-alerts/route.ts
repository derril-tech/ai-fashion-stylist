import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPriceAlert, analyzePriceHistory } from '@/lib/price-tracking';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/price-alerts');

  const rl = await rateLimit(request as unknown as Request, 'price_alerts_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/price-alerts');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const alerts = await db.priceAlert.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            priceCents: true,
            currency: true,
            imageUrl: true,
            url: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    span.end();
    return NextResponse.json({ alerts });
  } catch (error) {
    span.end();
    console.error('Error fetching price alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch price alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/price-alerts');

  const rl = await rateLimit(request as unknown as Request, 'price_alerts_post', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/price-alerts');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userId, productId, targetPrice, currency = 'USD' } = body;

    if (!userId || !productId || !targetPrice) {
      return NextResponse.json({ 
        error: 'userId, productId, and targetPrice are required' 
      }, { status: 400 });
    }

    // Verify product exists
    const product = await db.catalogProduct.findUnique({
      where: { id: productId },
      select: { id: true, name: true, priceCents: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already has an alert for this product
    const existingAlert = await db.priceAlert.findFirst({
      where: { userId, productId, isActive: true }
    });

    if (existingAlert) {
      // Update existing alert
      const updatedAlert = await db.priceAlert.update({
        where: { id: existingAlert.id },
        data: { targetPrice, currency },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              currency: true
            }
          }
        }
      });

      span.end();
      return NextResponse.json({ alert: updatedAlert });
    }

    // Create new alert
    const alert = await db.priceAlert.create({
      data: {
        userId,
        productId,
        targetPrice,
        currency
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            currency: true
          }
        }
      }
    });

    span.end();
    return NextResponse.json({ alert });
  } catch (error) {
    span.end();
    console.error('Error creating price alert:', error);
    return NextResponse.json({ error: 'Failed to create price alert' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const span = monitorAPIRequest('DELETE', '/api/price-alerts');

  const rl = await rateLimit(request as unknown as Request, 'price_alerts_delete', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/price-alerts');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');
    const userId = searchParams.get('userId');

    if (!alertId || !userId) {
      return NextResponse.json({ error: 'alertId and userId are required' }, { status: 400 });
    }

    const alert = await db.priceAlert.findFirst({
      where: { id: alertId, userId }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await db.priceAlert.update({
      where: { id: alertId },
      data: { isActive: false }
    });

    span.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    span.end();
    console.error('Error deleting price alert:', error);
    return NextResponse.json({ error: 'Failed to delete price alert' }, { status: 500 });
  }
}
