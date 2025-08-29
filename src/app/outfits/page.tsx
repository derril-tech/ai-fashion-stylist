import { OutfitGenerator } from '@/components/ui/outfit-generator';
import { FitAdvisorUI } from '@/components/ui/fit-advisor-ui';
import { ShopTheGap } from '@/components/ui/shop-the-gap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OutfitsPage() {
  // In a real app, you'd get the userId from authentication
  const userId = 'demo-user-123';

  return (
    <div className="container mx-auto px-4 py-8" aria-labelledby="outfits-heading">
      <div className="mb-8">
        <h1 id="outfits-heading" className="text-3xl font-bold mb-2">Outfit Styling</h1>
        <p className="text-gray-600">
          Generate personalized outfits and get fit recommendations based on your wardrobe and body profile
        </p>
      </div>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Outfit Generator</TabsTrigger>
          <TabsTrigger value="fit-advisor">Fit Advisor</TabsTrigger>
          <TabsTrigger value="shop-gap">Shop the Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <OutfitGenerator 
            userId={userId}
            onOutfitSelect={(outfit) => {
              console.log('Selected outfit:', outfit);
            }}
          />
        </TabsContent>

        <TabsContent value="fit-advisor">
          <FitAdvisorUI userId={userId} />
        </TabsContent>

        <TabsContent value="shop-gap">
          <ShopTheGap userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Feature Overview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Smart Outfit Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              AI-powered outfit combinations using color theory, texture compatibility, and formality matching. 
              Includes weather-aware suggestions and budget constraints.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personalized Fit Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get size recommendations for different brands, identify potential fit issues, 
              and receive personalized styling tips based on your body type.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weather & Shopping Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Real-time weather data and in-stock product matches to complete your looks.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
