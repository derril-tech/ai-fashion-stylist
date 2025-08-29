import { NextRequest, NextResponse } from 'next/server';
import { OutfitOptimizer } from '@/lib/outfit-optimizer';
import { WeatherService } from '@/lib/weather-service';
import { monitorAPIRequest } from '@/lib/observability';
import { db } from '@/lib/db';
import { recordRequestMetrics } from '@/lib/metrics';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

const optimizer = new OutfitOptimizer();
const weatherService = new WeatherService();

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/outfits/generate');
  const start = Date.now();

  // Rate limit
  const rl = await rateLimit(request as unknown as Request, 'outfits_generate', RATE_RULES.bursty);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/outfits/generate');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const body = await request.json();
    const {
      userId,
      constraints = {},
      location,
      maxCandidates = 6
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's wardrobe items
    const items = await db.item.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        colors: true,
        texture: true,
        formality: true,
        cost: true,
        lastWorn: true,
        wearCount: true,
        imageUrl: true
      }
    });

    if (items.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 items in wardrobe to generate outfits' },
        { status: 400 }
      );
    }

    // Get weather data if location provided
    let weatherConstraints = undefined;
    if (location) {
      try {
        const weather = await weatherService.getWeatherData(location);
        weatherConstraints = {
          temperature: weather.temperature,
          precipitation: weather.precipitation
        };
      } catch (error) {
        console.warn('Weather service failed, proceeding without weather constraints:', error);
      }
    }

    // Generate outfit candidates
    const candidates = await optimizer.optimizeOutfits(
      items.map(item => ({
        id: item.id,
        colors: item.colors,
        texture: item.texture,
        formality: item.formality,
        category: item.category,
        cost: item.cost,
        lastWorn: item.lastWorn,
        wearCount: item.wearCount
      })),
      {
        ...constraints,
        weather: weatherConstraints
      }
    );

    // Get detailed outfit information
    const outfitDetails = candidates.map(candidate => {
      const outfitItems = items.filter(item => candidate.items.includes(item.id));
      
      return {
        id: candidate.items.join('-'),
        items: outfitItems.map(item => ({
          id: item.id,
          title: item.title,
          brand: item.brand,
          category: item.category,
          colors: item.colors,
          imageUrl: item.imageUrl
        })),
        score: candidate.score,
        objectives: candidate.objectives,
        rationale: candidate.rationale,
        metadata: candidate.metadata,
        weatherScore: weatherConstraints ? 
          weatherService.getOutfitWeatherScore(
            outfitItems.map(item => ({ category: item.category, texture: item.texture })),
            { temperature: weatherConstraints.temperature, precipitation: weatherConstraints.precipitation } as any
          ) : null
      };
    });

    const status = 200;
    recordRequestMetrics('/api/outfits/generate', 'POST', status, Date.now() - start);
    span.end();

    return NextResponse.json({
      outfits: outfitDetails,
      totalCandidates: candidates.length,
      weather: weatherConstraints,
      suggestions: weatherConstraints ? 
        weatherService.getWeatherBasedSuggestions({ 
          temperature: weatherConstraints.temperature, 
          precipitation: weatherConstraints.precipitation 
        } as any) : []
    }, { status });

  } catch (error) {
    const status = 500;
    recordRequestMetrics('/api/outfits/generate', 'POST', status, Date.now() - start);
    span.end();
    console.error('Error generating outfits:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate outfits' },
      { status }
    );
  }
}
