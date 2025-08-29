'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sun, Cloud, CloudRain, Thermometer, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutfitItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  colors: string[];
  imageUrl: string;
}

interface OutfitCandidate {
  id: string;
  items: OutfitItem[];
  score: number;
  objectives: Record<string, number>;
  rationale: string;
  metadata: {
    styleScore: number;
    noveltyScore: number;
    rewearScore: number;
    costScore: number;
    totalCost: number;
    wearCount: number;
  };
  weatherScore?: number;
}

interface WeatherData {
  temperature: number;
  precipitation: number;
  condition: string;
}

interface OutfitGeneratorProps {
  userId: string;
  onOutfitSelect?: (outfit: OutfitCandidate) => void;
}

export function OutfitGenerator({ userId, onOutfitSelect }: OutfitGeneratorProps) {
  const [outfits, setOutfits] = useState<OutfitCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState('');
  const [constraints, setConstraints] = useState({
    maxCost: 0,
    formality: '',
    occasion: ''
  });
  const [useWeather, setUseWeather] = useState(false);

  const formalityOptions = [
    { value: 'casual', label: 'Casual' },
    { value: 'smart_casual', label: 'Smart Casual' },
    { value: 'business_casual', label: 'Business Casual' },
    { value: 'business', label: 'Business' },
    { value: 'formal', label: 'Formal' },
    { value: 'black_tie', label: 'Black Tie' }
  ];

  const occasionOptions = [
    { value: 'work', label: 'Work' },
    { value: 'date', label: 'Date Night' },
    { value: 'party', label: 'Party' },
    { value: 'weekend', label: 'Weekend' },
    { value: 'travel', label: 'Travel' },
    { value: 'sports', label: 'Sports/Active' }
  ];

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="h-4 w-4" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="h-4 w-4" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-4 w-4" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const generateOutfits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          constraints: {
            ...constraints,
            maxCost: constraints.maxCost > 0 ? constraints.maxCost : undefined
          },
          location: useWeather && location ? location : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate outfits');
      }

      const data = await response.json();
      setOutfits(data.outfits);
      
      if (data.weather) {
        setWeather(data.weather);
      }
    } catch (error) {
      console.error('Error generating outfits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getObjectiveColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Outfit Generator</CardTitle>
          <CardDescription>
            Generate personalized outfit combinations based on your wardrobe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weather Integration */}
          <div className="flex items-center space-x-2">
            <Switch
              id="use-weather"
              checked={useWeather}
              onCheckedChange={setUseWeather}
            />
            <Label htmlFor="use-weather">Include weather data</Label>
          </div>

          {useWeather && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter city name (e.g., New York, London)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-cost">Max Budget ($)</Label>
              <Input
                id="max-cost"
                type="number"
                placeholder="0 = no limit"
                value={constraints.maxCost}
                onChange={(e) => setConstraints(prev => ({
                  ...prev,
                  maxCost: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formality">Formality Level</Label>
              <Select
                value={constraints.formality}
                onValueChange={(value) => setConstraints(prev => ({
                  ...prev,
                  formality: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select formality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any formality</SelectItem>
                  {formalityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select
                value={constraints.occasion}
                onValueChange={(value) => setConstraints(prev => ({
                  ...prev,
                  occasion: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any occasion</SelectItem>
                  {occasionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateOutfits} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Outfits...
              </>
            ) : (
              'Generate Outfits'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Weather Display */}
      {weather && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getWeatherIcon(weather.condition)}
              <span>Current Weather</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Thermometer className="h-4 w-4" />
                  <span>{weather.temperature}°C</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CloudRain className="h-4 w-4" />
                  <span>{weather.precipitation}mm/h</span>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {weather.condition}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Outfits */}
      {outfits.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Outfits ({outfits.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.map((outfit, index) => (
              <Card key={outfit.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Outfit #{index + 1}</CardTitle>
                    <Badge className={cn('text-xs', getScoreColor(outfit.score))}>
                      {outfit.score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Items */}
                  <div className="space-y-2">
                    {outfit.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.brand} • {item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Objectives */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Performance:</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span>Style:</span>
                        <span className={getObjectiveColor(outfit.objectives.styleScore)}>
                          {Math.round(outfit.objectives.styleScore)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Novelty:</span>
                        <span className={getObjectiveColor(outfit.objectives.novelty)}>
                          {Math.round(outfit.objectives.novelty)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Re-wear:</span>
                        <span className={getObjectiveColor(outfit.objectives.rewear)}>
                          {Math.round(outfit.objectives.rewear)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className={getObjectiveColor(outfit.objectives.cost)}>
                          {Math.round(outfit.objectives.cost)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weather Score */}
                  {outfit.weatherScore !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span>Weather Fit:</span>
                      <Badge variant="outline" className={getScoreColor(outfit.weatherScore)}>
                        {Math.round(outfit.weatherScore)}%
                      </Badge>
                    </div>
                  )}

                  {/* Rationale */}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {outfit.rationale}
                  </p>

                  {/* Action */}
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => onOutfitSelect?.(outfit)}
                  >
                    Select Outfit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
