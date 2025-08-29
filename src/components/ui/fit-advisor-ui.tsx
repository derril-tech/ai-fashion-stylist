'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Ruler, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BodyProfile {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
  inseam: number;
  shoulder: number;
  armLength: number;
  shoeSize: number;
  bodyType: string;
  measurements?: {
    neck: number;
    bicep: number;
    thigh: number;
    calf: number;
  };
}

interface SizeRecommendation {
  brand: string;
  recommendedSize: string;
  confidence: number;
  fitNotes: string[];
  alternatives: string[];
  measurements: {
    bust?: number;
    waist?: number;
    hips?: number;
    length?: number;
  };
}

interface SilhouetteTip {
  category: string;
  tip: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  bodyTypes: string[];
}

interface FitAnalysis {
  overallFit: number;
  recommendations: SizeRecommendation[];
  silhouetteTips: SilhouetteTip[];
  fitIssues: string[];
  confidence: number;
}

interface FitAdvisorUIProps {
  userId: string;
  itemId?: string;
}

export function FitAdvisorUI({ userId, itemId }: FitAdvisorUIProps) {
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const bodyTypeOptions = [
    { value: 'hourglass', label: 'Hourglass' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'inverted-triangle', label: 'Inverted Triangle' },
    { value: 'oval', label: 'Oval' }
  ];

  const bodyTypeDescriptions = {
    hourglass: 'Balanced proportions with defined waist',
    rectangle: 'Straight figure with minimal waist definition',
    triangle: 'Wider hips than shoulders',
    'inverted-triangle': 'Wider shoulders than hips',
    oval: 'Rounded figure with full midsection'
  };

  useEffect(() => {
    loadBodyProfile();
  }, [userId]);

  useEffect(() => {
    if (itemId && bodyProfile) {
      analyzeFit();
    }
  }, [itemId, bodyProfile]);

  const loadBodyProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fit/analyze?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBodyProfile(data.bodyProfile);
      }
    } catch (error) {
      console.error('Error loading body profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFit = async () => {
    if (!itemId || !bodyProfile) return;

    setLoading(true);
    try {
      const response = await fetch('/api/fit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId,
          bodyProfile
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFitAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing fit:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBodyProfile = async (updates: Partial<BodyProfile>) => {
    if (!bodyProfile) return;

    const updatedProfile = { ...bodyProfile, ...updates };
    setBodyProfile(updatedProfile);

    // Here you would typically save to the database
    // For now, we'll just update the local state
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !bodyProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Body Profile</TabsTrigger>
          <TabsTrigger value="analysis">Fit Analysis</TabsTrigger>
          <TabsTrigger value="tips">Style Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Body Measurements</span>
              </CardTitle>
              <CardDescription>
                Update your measurements for accurate fit recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bodyProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={bodyProfile.height}
                      onChange={(e) => updateBodyProfile({ height: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={bodyProfile.weight}
                      onChange={(e) => updateBodyProfile({ weight: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bust">Bust (cm)</Label>
                    <Input
                      id="bust"
                      type="number"
                      value={bodyProfile.bust}
                      onChange={(e) => updateBodyProfile({ bust: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waist">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      value={bodyProfile.waist}
                      onChange={(e) => updateBodyProfile({ waist: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hips">Hips (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      value={bodyProfile.hips}
                      onChange={(e) => updateBodyProfile({ hips: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shoulder">Shoulder Width (cm)</Label>
                    <Input
                      id="shoulder"
                      type="number"
                      value={bodyProfile.shoulder}
                      onChange={(e) => updateBodyProfile({ shoulder: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inseam">Inseam (cm)</Label>
                    <Input
                      id="inseam"
                      type="number"
                      value={bodyProfile.inseam}
                      onChange={(e) => updateBodyProfile({ inseam: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shoeSize">Shoe Size (EU)</Label>
                    <Input
                      id="shoeSize"
                      type="number"
                      value={bodyProfile.shoeSize}
                      onChange={(e) => updateBodyProfile({ shoeSize: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No body profile found. Please create one.</p>
                  <Button className="mt-4">Create Profile</Button>
                </div>
              )}

              {bodyProfile && (
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body Type</Label>
                  <Select
                    value={bodyProfile.bodyType}
                    onValueChange={(value) => updateBodyProfile({ bodyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bodyProfile.bodyType && (
                    <p className="text-sm text-gray-600">
                      {bodyTypeDescriptions[bodyProfile.bodyType as keyof typeof bodyTypeDescriptions]}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {itemId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Fit Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : fitAnalysis ? (
                  <div className="space-y-4">
                    {/* Overall Fit Score */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Overall Fit Score:</span>
                      <Badge className={cn('text-sm', getFitScoreColor(fitAnalysis.overallFit))}>
                        {fitAnalysis.overallFit}%
                      </Badge>
                    </div>

                    {/* Size Recommendations */}
                    {fitAnalysis.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Size Recommendations</h4>
                        {fitAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{rec.brand}</span>
                              <Badge variant="outline">{rec.recommendedSize}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Confidence:</span>
                              <span className={getConfidenceColor(rec.confidence)}>
                                {rec.confidence}%
                              </span>
                            </div>
                            {rec.fitNotes.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Fit Notes:</p>
                                <ul className="text-sm text-gray-600 mt-1">
                                  {rec.fitNotes.map((note, i) => (
                                    <li key={i} className="flex items-start space-x-1">
                                      <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fit Issues */}
                    {fitAnalysis.fitIssues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-600">Potential Fit Issues</h4>
                        <ul className="space-y-1">
                          {fitAnalysis.fitIssues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Select an item to analyze its fit
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select an item from your wardrobe to analyze its fit</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ruler className="h-5 w-5" />
                <span>Style Tips for Your Body Type</span>
              </CardTitle>
              <CardDescription>
                Personalized styling advice based on your body type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bodyProfile ? (
                <div className="space-y-4">
                  {fitAnalysis?.silhouetteTips.map((tip, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getPriorityColor(tip.priority)}>
                          {tip.priority} priority
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {tip.category}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">{tip.tip}</h4>
                      <p className="text-sm text-gray-600">{tip.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Complete your body profile to get personalized style tips</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
