"use client"

import { useState } from 'react'
import { UploadZone } from '@/components/ui/upload-zone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Sparkles, Camera, Shield, Zap } from 'lucide-react'

export default function UploadPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<File[]>([])

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setProcessedFiles(files)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-fashion-purple" />
            <h1 className="text-2xl font-bold">AI Fashion Stylist</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Upload Your Wardrobe</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Take photos of your clothes or upload existing ones. Our AI will automatically categorize and organize your wardrobe.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="fashion-card">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-fashion-pink/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-6 w-6 text-fashion-pink" />
                </div>
                <CardTitle>Smart Detection</CardTitle>
                <CardDescription>
                  AI automatically identifies clothing items, colors, patterns, and brands
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="fashion-card">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-fashion-purple/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-fashion-purple" />
                </div>
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Face blur enabled by default. Your data is secure and private
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="fashion-card">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-fashion-mint/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-fashion-mint" />
                </div>
                <CardTitle>Fast Processing</CardTitle>
                <CardDescription>
                  Get your wardrobe organized in minutes, not hours
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Upload Zone */}
          <Card className="fashion-card">
            <CardHeader>
              <CardTitle>Upload Your Clothes</CardTitle>
              <CardDescription>
                Drag and drop your clothing photos or click to browse. We support JPEG, PNG, and WebP formats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone
                onFilesSelected={handleFilesSelected}
                maxFiles={20}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </CardContent>
          </Card>

          {/* Processing Status */}
          {isProcessing && (
            <Card className="fashion-card mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fashion-purple"></div>
                  <p className="text-lg">Processing your wardrobe...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {processedFiles.length > 0 && !isProcessing && (
            <Card className="fashion-card mt-6">
              <CardHeader>
                <CardTitle>Processing Complete!</CardTitle>
                <CardDescription>
                  Successfully processed {processedFiles.length} items. Your wardrobe is now ready for styling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button className="fashion-gradient">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Outfits
                  </Button>
                  <Button variant="outline">
                    View Wardrobe
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="fashion-card mt-6">
            <CardHeader>
              <CardTitle>Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Take photos on a plain background for better item detection</li>
                <li>• Ensure good lighting to capture true colors</li>
                <li>• Include size tags when possible for accurate sizing</li>
                <li>• Take photos from multiple angles for complex items</li>
                <li>• Remove wrinkles and fold clothes neatly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
