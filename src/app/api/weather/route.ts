import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/weather-service';
import { monitorAPIRequest } from '@/lib/observability';
import { rateLimit, RATE_RULES } from '@/lib/rate-limit';
import { logAbuse } from '@/lib/security-log';
import { recordRequestMetrics } from '@/lib/metrics';

const weatherService = new WeatherService();

export async function GET(request: NextRequest) {
  const span = monitorAPIRequest('GET', '/api/weather');
  const start = Date.now();

  const rl = await rateLimit(request as unknown as Request, 'weather_get', RATE_RULES.heavy);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/weather');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const forecast = searchParams.get('forecast') === 'true';
    const days = parseInt(searchParams.get('days') || '7');

    if (!location && (!lat || !lon)) {
      return NextResponse.json(
        { error: 'Location or coordinates (lat, lon) are required' },
        { status: 400 }
      );
    }

    let weatherData;
    
    if (forecast) {
      // Get weather forecast
      const locationParam = location || { lat: parseFloat(lat!), lon: parseFloat(lon!) };
      weatherData = await weatherService.getWeatherForecast(locationParam, days);
    } else {
      // Get current weather
      const locationParam = location || { lat: parseFloat(lat!), lon: parseFloat(lon!) };
      weatherData = await weatherService.getWeatherData(locationParam);
    }

    // Get outfit constraints based on weather
    const constraints = await weatherService.getWeatherForOutfitConstraints(
      location || { lat: parseFloat(lat!), lon: parseFloat(lon!) }
    );

    // Get weather-based outfit suggestions
    const suggestions = forecast ? [] : weatherService.getWeatherBasedSuggestions(weatherData as any);

    const status = 200;
    recordRequestMetrics('/api/weather', 'GET', status, Date.now() - start);
    span.end();

    return NextResponse.json({
      weather: weatherData,
      constraints,
      suggestions,
      cache: weatherService.getCacheStats()
    }, { status });

  } catch (error) {
    const status = 500;
    recordRequestMetrics('/api/weather', 'GET', status, Date.now() - start);
    span.end();
    console.error('Error fetching weather data:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const span = monitorAPIRequest('DELETE', '/api/weather');

  const rl = await rateLimit(request as unknown as Request, 'weather_delete', RATE_RULES.sensitive);
  if (!rl.allowed) {
    logAbuse(request.headers.get('x-real-ip') || 'unknown', '/api/weather');
    span.end();
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    // Clear weather cache
    weatherService.clearCache();
    
    span.end();
    
    return NextResponse.json({
      message: 'Weather cache cleared successfully',
      cache: weatherService.getCacheStats()
    });

  } catch (error) {
    span.end();
    console.error('Error clearing weather cache:', error);
    
    return NextResponse.json(
      { error: 'Failed to clear weather cache' },
      { status: 500 }
    );
  }
}
