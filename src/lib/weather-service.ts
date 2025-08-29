import { monitorImageProcessing } from './observability';

export interface WeatherData {
  temperature: number; // Celsius
  precipitation: number; // mm/h
  humidity: number; // percentage
  windSpeed: number; // km/h
  condition: string; // sunny, cloudy, rainy, etc.
  feelsLike: number; // Celsius
  timestamp: number; // Unix timestamp
}

export interface WeatherCache {
  data: WeatherData;
  expiresAt: number;
}

export interface WeatherConstraints {
  minTemperature?: number;
  maxTemperature?: number;
  maxPrecipitation?: number;
  maxWindSpeed?: number;
  conditions?: string[]; // Allowed weather conditions
}

export class WeatherService {
  private cache: Map<string, WeatherCache> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly API_KEY = process.env.WEATHER_API_KEY || 'YOUR_WEATHER_API_KEY';
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    // Clean up expired cache entries periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  async getWeatherData(
    location: string | { lat: number; lon: number }
  ): Promise<WeatherData> {
    const span = monitorImageProcessing('getWeatherData', { location: typeof location === 'string' ? location : 'coordinates' });
    
    const cacheKey = this.getCacheKey(location);
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() < cached.expiresAt) {
      span.end();
      return cached.data;
    }

    try {
      const weatherData = await this.fetchWeatherData(location);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        expiresAt: Date.now() + this.CACHE_DURATION
      });

      span.end();
      return weatherData;
    } catch (error) {
      span.end();
      
      // Return cached data even if expired as fallback
      if (cached) {
        console.warn('Weather API failed, using expired cache:', error);
        return cached.data;
      }
      
      // Return default weather data if no cache available
      console.error('Weather API failed and no cache available:', error);
      return this.getDefaultWeatherData();
    }
  }

  async getWeatherForOutfitConstraints(
    location: string | { lat: number; lon: number }
  ): Promise<WeatherConstraints> {
    const weather = await this.getWeatherData(location);
    
    return {
      minTemperature: weather.temperature - 5, // Allow some flexibility
      maxTemperature: weather.temperature + 5,
      maxPrecipitation: weather.precipitation > 0 ? 10 : 0, // Allow light rain
      maxWindSpeed: weather.windSpeed > 20 ? 30 : 20, // Allow moderate wind
      conditions: this.getCompatibleConditions(weather.condition)
    };
  }

  getOutfitWeatherScore(
    outfitItems: Array<{ category: string; texture: string }>,
    weather: WeatherData
  ): number {
    let score = 100;

    // Temperature considerations
    if (weather.temperature < 10) {
      // Cold weather - need warm items
      const hasWarmItems = outfitItems.some(item => 
        ['outerwear', 'sweaters', 'jackets', 'coats'].includes(item.category) ||
        ['wool', 'fleece', 'thick', 'knit'].includes(item.texture)
      );
      if (!hasWarmItems) score -= 40;
    } else if (weather.temperature > 25) {
      // Hot weather - need light items
      const hasLightItems = outfitItems.some(item => 
        ['shorts', 'tanks', 'light', 'cotton', 'linen'].includes(item.texture) ||
        ['dresses', 'skirts'].includes(item.category)
      );
      if (!hasLightItems) score -= 30;
    }

    // Precipitation considerations
    if (weather.precipitation > 0.5) {
      // Rainy weather - need water-resistant items
      const hasWaterResistant = outfitItems.some(item => 
        ['outerwear', 'jackets', 'coats'].includes(item.category) ||
        ['waterproof', 'water-resistant', 'nylon', 'polyester'].includes(item.texture)
      );
      if (!hasWaterResistant) score -= 30;
    }

    // Wind considerations
    if (weather.windSpeed > 15) {
      // Windy weather - need secure items
      const hasSecureItems = outfitItems.some(item => 
        ['pants', 'jeans', 'shorts'].includes(item.category) ||
        ['heavy', 'thick'].includes(item.texture)
      );
      if (!hasSecureItems) score -= 20;
    }

    // Humidity considerations
    if (weather.humidity > 70) {
      // High humidity - prefer breathable fabrics
      const hasBreathableItems = outfitItems.some(item => 
        ['cotton', 'linen', 'breathable'].includes(item.texture)
      );
      if (!hasBreathableItems) score -= 15;
    }

    return Math.max(0, score);
  }

  getWeatherBasedSuggestions(weather: WeatherData): string[] {
    const suggestions: string[] = [];

    if (weather.temperature < 10) {
      suggestions.push('Layer up with warm outerwear');
      suggestions.push('Choose wool or fleece textures');
    } else if (weather.temperature > 25) {
      suggestions.push('Opt for light, breathable fabrics');
      suggestions.push('Consider cotton or linen materials');
    }

    if (weather.precipitation > 0.5) {
      suggestions.push('Include water-resistant outerwear');
      suggestions.push('Choose waterproof footwear');
    }

    if (weather.windSpeed > 15) {
      suggestions.push('Secure items that won\'t blow around');
      suggestions.push('Consider heavier fabrics');
    }

    if (weather.humidity > 70) {
      suggestions.push('Choose breathable, moisture-wicking fabrics');
      suggestions.push('Avoid heavy, non-breathable materials');
    }

    return suggestions;
  }

  private async fetchWeatherData(
    location: string | { lat: number; lon: number }
  ): Promise<WeatherData> {
    let url: string;
    
    if (typeof location === 'string') {
      // City name lookup
      url = `${this.BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${this.API_KEY}&units=metric`;
    } else {
      // Coordinates lookup
      url = `${this.BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&appid=${this.API_KEY}&units=metric`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AI-Fashion-Stylist/1.0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      temperature: data.main.temp,
      precipitation: data.rain?.['1h'] || 0,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      condition: data.weather[0].main.toLowerCase(),
      feelsLike: data.main.feels_like,
      timestamp: Date.now()
    };
  }

  private getCacheKey(location: string | { lat: number; lon: number }): string {
    if (typeof location === 'string') {
      return `weather:${location.toLowerCase().replace(/\s+/g, '_')}`;
    }
    return `weather:${location.lat.toFixed(2)}_${location.lon.toFixed(2)}`;
  }

  private getCompatibleConditions(condition: string): string[] {
    const conditionMap: Record<string, string[]> = {
      'clear': ['clear', 'sunny'],
      'clouds': ['clouds', 'partly_cloudy'],
      'rain': ['rain', 'drizzle', 'light_rain'],
      'snow': ['snow', 'light_snow'],
      'thunderstorm': ['thunderstorm'],
      'mist': ['mist', 'fog', 'haze'],
      'smoke': ['smoke', 'haze'],
      'haze': ['haze', 'mist'],
      'dust': ['dust'],
      'fog': ['fog', 'mist'],
      'sand': ['sand'],
      'ash': ['ash'],
      'squall': ['squall'],
      'tornado': ['tornado']
    };

    return conditionMap[condition] || [condition];
  }

  private getDefaultWeatherData(): WeatherData {
    return {
      temperature: 20,
      precipitation: 0,
      humidity: 50,
      windSpeed: 10,
      condition: 'clear',
      feelsLike: 20,
      timestamp: Date.now()
    };
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (now > cache.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get weather forecast for planning outfits
  async getWeatherForecast(
    location: string | { lat: number; lon: number },
    days: number = 7
  ): Promise<WeatherData[]> {
    const span = monitorImageProcessing('getWeatherForecast', { days });
    
    try {
      let url: string;
      
      if (typeof location === 'string') {
        url = `${this.BASE_URL}/forecast?q=${encodeURIComponent(location)}&appid=${this.API_KEY}&units=metric&cnt=${days * 8}`; // 8 readings per day
      } else {
        url = `${this.BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${this.API_KEY}&units=metric&cnt=${days * 8}`;
      }

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AI-Fashion-Stylist/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for forecast
      });

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Group by day and calculate daily averages
      const dailyForecasts: WeatherData[] = [];
      const dailyData: Record<string, any[]> = {};

      for (const item of data.list) {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      }

      for (const [date, items] of Object.entries(dailyData)) {
        const avgTemp = items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
        const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
        const avgWindSpeed = items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length;
        const totalPrecipitation = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
        const mostCommonCondition = this.getMostCommonCondition(items.map(item => item.weather[0].main));

        dailyForecasts.push({
          temperature: Math.round(avgTemp * 10) / 10,
          precipitation: Math.round(totalPrecipitation * 10) / 10,
          humidity: Math.round(avgHumidity),
          windSpeed: Math.round(avgWindSpeed * 3.6), // Convert to km/h
          condition: mostCommonCondition.toLowerCase(),
          feelsLike: Math.round(avgTemp * 10) / 10,
          timestamp: new Date(date).getTime()
        });
      }

      span.end();
      return dailyForecasts.slice(0, days);
    } catch (error) {
      span.end();
      console.error('Weather forecast API failed:', error);
      
      // Return default forecast
      const defaultForecast: WeatherData[] = [];
      for (let i = 0; i < days; i++) {
        defaultForecast.push({
          ...this.getDefaultWeatherData(),
          timestamp: Date.now() + (i * 24 * 60 * 60 * 1000)
        });
      }
      return defaultForecast;
    }
  }

  private getMostCommonCondition(conditions: string[]): string {
    const counts: Record<string, number> = {};
    for (const condition of conditions) {
      counts[condition] = (counts[condition] || 0) + 1;
    }
    
    let mostCommon = conditions[0];
    let maxCount = 0;
    
    for (const [condition, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = condition;
      }
    }
    
    return mostCommon;
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
