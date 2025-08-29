import { NextRequest, NextResponse } from 'next/server';
import { FitAdvisor, FitAdvisor as FitAdvisorType } from '@/lib/fit-advisor';
import { monitorAPIRequest } from '@/lib/observability';
import { db } from '@/lib/db';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';

export async function POST(request: NextRequest) {
  const span = monitorAPIRequest('POST', '/api/fit/analyze');

  const rl = await rateLimit(request as unknown as Request, 'fit_analyze_post', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/fit/analyze');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const body = await request.json();
    const {
      userId,
      itemId,
      bodyProfile
    } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'User ID and item ID are required' },
        { status: 400 }
      );
    }

    // Get item details from database
    const item = await db.item.findFirst({
      where: {
        id: itemId,
        userId
      },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        size: true,
        measurements: true
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or not accessible' },
        { status: 404 }
      );
    }

    // Get or create body profile
    let userBodyProfile;
    if (bodyProfile) {
      userBodyProfile = bodyProfile;
    } else {
      // Get from database
      const profile = await db.bodyProfile.findFirst({
        where: { userId }
      });
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Body profile not found. Please provide body profile or create one first.' },
          { status: 404 }
        );
      }
      
      userBodyProfile = {
        height: profile.height,
        weight: profile.weight,
        bust: profile.bust,
        waist: profile.waist,
        hips: profile.hips,
        inseam: profile.inseam,
        shoulder: profile.shoulder,
        armLength: profile.armLength,
        shoeSize: profile.shoeSize,
        bodyType: profile.bodyType as any,
        measurements: profile.additionalMeasurements as any
      };
    }

    // Create fit advisor and analyze fit
    const fitAdvisor = new FitAdvisor(userBodyProfile);
    
    const fitAnalysis = await fitAdvisor.analyzeFit({
      brand: item.brand || 'unknown',
      category: item.category,
      currentSize: item.size || 'M',
      measurements: item.measurements as any
    });

    // Get general fit advice for user's body type
    const generalAdvice = fitAdvisor.getGeneralFitAdvice();

    span.end();

    return NextResponse.json({
      item: {
        id: item.id,
        title: item.title,
        brand: item.brand,
        category: item.category,
        size: item.size
      },
      bodyProfile: userBodyProfile,
      analysis: fitAnalysis,
      generalAdvice,
      bodyType: userBodyProfile.bodyType
    });

  } catch (error) {
    span.end();
    console.error('Error analyzing fit:', error);
    
    return NextResponse.json(
      { error: 'Failed to analyze fit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/fit/analyze');

  const rl = await rateLimit(request as unknown as Request, 'fit_analyze_get', RATE_RULES.default);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/fit/analyze');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bodyType = searchParams.get('bodyType');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get body profile from database
    const profile = await db.bodyProfile.findFirst({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Body profile not found' },
        { status: 404 }
      );
    }

    const userBodyProfile = {
      height: profile.height,
      weight: profile.weight,
      bust: profile.bust,
      waist: profile.waist,
      hips: profile.hips,
      inseam: profile.inseam,
      shoulder: profile.shoulder,
      armLength: profile.armLength,
      shoeSize: profile.shoeSize,
      bodyType: profile.bodyType as any,
      measurements: profile.additionalMeasurements as any
    };

    // Get general fit advice
    const fitAdvisor = new FitAdvisor(userBodyProfile);
    const generalAdvice = fitAdvisor.getGeneralFitAdvice();

    span.end();

    return NextResponse.json({
      bodyProfile: userBodyProfile,
      generalAdvice,
      bodyType: userBodyProfile.bodyType
    });

  } catch (error) {
    span.end();
    console.error('Error getting fit advice:', error);
    
    return NextResponse.json(
      { error: 'Failed to get fit advice' },
      { status: 500 }
    );
  }
}
