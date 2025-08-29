'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Award, TrendingUp, Filter, RefreshCw } from 'lucide-react';

interface SustainabilityMetrics {
  averageScore: number;
  totalItems: number;
  scoredItems: number;
  badgeDistribution: Record<string, number>;
}

interface SustainabilityItem {
  id: string;
  title?: string;
  brand?: string;
  category: string;
  sustainabilityScore?: number;
  sustainabilityBadges?: string[];
}

interface SustainabilityDashboardProps {
  userId: string;
}

export function SustainabilityDashboard({ userId }: SustainabilityDashboardProps) {
  const [items, setItems] = useState<SustainabilityItem[]>([]);
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>(null);

  useEffect(() => {
    fetchSustainabilityData();
    fetchFilters();
  }, [userId]);

  const fetchSustainabilityData = async () => {
    try {
      const response = await fetch(`/api/sustainability?userId=${userId}`);
      const data = await response.json();
      setItems(data.items || []);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching sustainability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await fetch('/api/sustainability?action=filters');
      const data = await response.json();
      setFilters(data.filters);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const recalculateScore = async (itemId: string) => {
    try {
      const response = await fetch('/api/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId, recalculate: true })
      });

      if (response.ok) {
        fetchSustainabilityData(); // Refresh data
      }
    } catch (error) {
      console.error('Error recalculating score:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sustainability data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sustainability Dashboard</h2>
          <p className="text-muted-foreground">
            Track the environmental impact of your wardrobe
          </p>
        </div>
        <Button variant="outline" onClick={fetchSustainabilityData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageScore}/100</div>
              <Progress value={metrics.averageScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getScoreLabel(metrics.averageScore)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.scoredItems} scored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Badge</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.badgeDistribution).length > 0 ? (
                <div>
                  <div className="text-lg font-bold">
                    {Object.entries(metrics.badgeDistribution)
                      .sort(([,a], [,b]) => b - a)[0]?.[1] || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Object.entries(metrics.badgeDistribution)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No badges yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((metrics.scoredItems / metrics.totalItems) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Items analyzed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {item.title || `${item.category} item`}
                    </h3>
                    {item.brand && (
                      <p className="text-sm text-muted-foreground">{item.brand}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      {item.sustainabilityBadges?.map((badge) => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {item.sustainabilityScore !== null && item.sustainabilityScore !== undefined ? (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(item.sustainabilityScore)}`}>
                          {item.sustainabilityScore}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getScoreLabel(item.sustainabilityScore)}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Not scored</div>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recalculateScore(item.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Sustainability Insights</CardTitle>
              <CardDescription>
                Tips to improve your wardrobe's environmental impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  🌱 Choose Organic Materials
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Look for items made from organic cotton, hemp, or linen to reduce chemical usage.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  ♻️ Support Recycled Content
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Items with recycled materials help reduce waste and resource consumption.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                  🏭 Consider Brand Ethics
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Research brands' sustainability practices and labor conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle>Brand Sustainability Scores</CardTitle>
              <CardDescription>
                How your favorite brands rank on sustainability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filters?.brands ? (
                <div className="space-y-3">
                  {filters.brands.slice(0, 10).map((brand: any) => (
                    <div key={brand.name} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{brand.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={brand.score} className="w-24" />
                        <span className={`text-sm font-medium ${getScoreColor(brand.score)}`}>
                          {brand.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading brand data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
