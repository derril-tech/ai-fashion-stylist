import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Camera, Sparkles, ShoppingBag, Calendar, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-fashion-purple" />
            <h1 className="text-2xl font-bold">AI Fashion Stylist</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4" aria-labelledby="hero-heading">
        <div className="container mx-auto text-center">
          <h1 id="hero-heading" className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-fashion-pink via-fashion-purple to-fashion-mint bg-clip-text text-transparent">
            Snap Your Wardrobe
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Set the vibe, and get shoppable outfits—styled for your body, occasion, weather, and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="fashion-gradient text-white hover:opacity-90">
              <Camera className="mr-2 h-5 w-5" />
              Upload Your Wardrobe
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/outfits">
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Outfits
              </a>
            </Button>
            <Button variant="outline" size="lg">
              <Sparkles className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30" aria-labelledby="features-heading">
        <div className="container mx-auto">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">
            Your Personal AI Stylist
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="fashion-card">
              <CardHeader>
                <div className="w-12 h-12 bg-fashion-pink/20 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-fashion-pink" />
                </div>
                <CardTitle>Smart Upload</CardTitle>
                <CardDescription>
                  Upload photos of your clothes and let AI automatically categorize, tag, and organize your wardrobe.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="fashion-card">
              <CardHeader>
                <div className="w-12 h-12 bg-fashion-purple/20 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-fashion-purple" />
                </div>
                <CardTitle>AI Outfit Generation</CardTitle>
                <CardDescription>
                  Get personalized outfit suggestions based on occasion, weather, and your style preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="fashion-card">
              <CardHeader>
                <div className="w-12 h-12 bg-fashion-mint/20 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingBag className="h-6 w-6 text-fashion-mint" />
                </div>
                <CardTitle>Shop the Gap</CardTitle>
                <CardDescription>
                  Discover missing pieces to complete your looks with curated shopping recommendations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4" aria-labelledby="how-heading">
        <div className="container mx-auto">
          <h2 id="how-heading" className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-fashion-pink rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
              <p className="text-muted-foreground">Take photos of your clothes or upload existing ones</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-fashion-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">AI automatically tags and categorizes your items</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-fashion-mint rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Outfits</h3>
              <p className="text-muted-foreground">Receive personalized outfit suggestions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-fashion-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Shop & Style</h3>
              <p className="text-muted-foreground">Complete your looks with shopping recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 fashion-gradient">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Wardrobe?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have discovered their perfect style with AI-powered fashion recommendations.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
            <Zap className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 AI Fashion Stylist. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
