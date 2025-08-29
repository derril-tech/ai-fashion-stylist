import cv from '@u4/opencv4nodejs'
import { monitorImageProcessing } from './observability'

export interface ClothingAttributes {
  category: string
  colors: string[]
  pattern: string
  fabric: string
  confidence: number
}

// Color mapping to human-readable names
const COLOR_NAMES: Record<string, string> = {
  'red': 'Red',
  'orange': 'Orange',
  'yellow': 'Yellow',
  'green': 'Green',
  'blue': 'Blue',
  'purple': 'Purple',
  'pink': 'Pink',
  'brown': 'Brown',
  'black': 'Black',
  'white': 'White',
  'gray': 'Gray',
  'beige': 'Beige',
  'navy': 'Navy',
  'olive': 'Olive',
  'maroon': 'Maroon',
  'burgundy': 'Burgundy',
  'cream': 'Cream',
  'tan': 'Tan',
  'khaki': 'Khaki',
  'coral': 'Coral',
  'teal': 'Teal',
  'turquoise': 'Turquoise',
  'lavender': 'Lavender',
  'mint': 'Mint',
  'gold': 'Gold',
  'silver': 'Silver',
  'bronze': 'Bronze',
  'copper': 'Copper'
}

// Pattern types
const PATTERN_TYPES = [
  'solid', 'striped', 'polka_dot', 'floral', 'geometric', 'plaid', 'checkered',
  'paisley', 'animal_print', 'tie_dye', 'camouflage', 'abstract', 'tribal',
  'chevron', 'herringbone', 'houndstooth', 'gingham', 'tartan', 'argyle'
]

// Fabric types
const FABRIC_TYPES = [
  'cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather', 'suede',
  'velvet', 'satin', 'chiffon', 'lace', 'mesh', 'fleece', 'cashmere', 'acrylic',
  'nylon', 'spandex', 'rayon', 'viscose', 'jersey', 'tweed', 'corduroy'
]

export async function extractClothingAttributes(
  imageBuffer: Buffer,
  maskBuffer: Buffer
): Promise<ClothingAttributes> {
  const startTime = performance.now()
  
  try {
    const image = cv.imdecode(imageBuffer)
    const mask = cv.imdecode(maskBuffer, cv.IMREAD_GRAYSCALE)
    
    // Apply mask to get only the clothing item
    const maskedImage = new cv.Mat()
    image.copyTo(maskedImage, mask)
    
    // Extract attributes
    const colors = await extractColors(maskedImage, mask)
    const pattern = await classifyPattern(maskedImage)
    const fabric = await classifyFabric(maskedImage)
    const category = await classifyCategory(maskedImage)
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('attribute_extraction', imageBuffer.length, duration, true)
    
    return {
      category,
      colors,
      pattern,
      fabric,
      confidence: 0.85 // Placeholder confidence score
    }
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('attribute_extraction', imageBuffer.length, duration, false)
    throw error
  }
}

async function extractColors(image: cv.Mat, mask: cv.Mat): Promise<string[]> {
  // Convert to LAB color space for better color analysis
  const labImage = image.cvtColor(cv.COLOR_BGR2LAB)
  
  // Calculate color histogram
  const hist = cv.calcHist([labImage], [0, 1, 2], mask, [8, 8, 8], [0, 256, 0, 256, 0, 256])
  
  // Find dominant colors
  const colors: string[] = []
  const colorCounts: Record<string, number> = {}
  
  // Sample pixels and map to color names
  for (let y = 0; y < image.rows; y += 10) {
    for (let x = 0; x < image.cols; x += 10) {
      if (mask.at(y, x) > 0) {
        const pixel = image.at(y, x)
        const colorName = mapRGBToColorName(pixel)
        
        if (colorName) {
          colorCounts[colorName] = (colorCounts[colorName] || 0) + 1
        }
      }
    }
  }
  
  // Sort by frequency and return top colors
  const sortedColors = Object.entries(colorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([color]) => color)
  
  return sortedColors
}

function mapRGBToColorName(pixel: cv.Vec3): string | null {
  const [b, g, r] = pixel
  
  // Simple color mapping based on RGB values
  if (r > 200 && g < 100 && b < 100) return 'red'
  if (r > 200 && g > 150 && b < 100) return 'orange'
  if (r > 200 && g > 200 && b < 100) return 'yellow'
  if (r < 100 && g > 150 && b < 100) return 'green'
  if (r < 100 && g < 100 && b > 150) return 'blue'
  if (r > 150 && g < 100 && b > 150) return 'purple'
  if (r > 200 && g < 150 && b > 150) return 'pink'
  if (r > 100 && g > 50 && b < 100) return 'brown'
  if (r < 50 && g < 50 && b < 50) return 'black'
  if (r > 200 && g > 200 && b > 200) return 'white'
  if (r > 100 && g > 100 && b > 100 && r < 150 && g < 150 && b < 150) return 'gray'
  
  return null
}

async function classifyPattern(image: cv.Mat): Promise<string> {
  // Convert to grayscale for pattern analysis
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY)
  
  // Apply edge detection
  const edges = gray.canny(50, 150)
  
  // Calculate edge density
  const edgeDensity = cv.countNonZero(edges) / (edges.rows * edges.cols)
  
  // Apply FFT for frequency analysis
  const fft = cv.dft(gray.convertTo(cv.CV_32F))
  const magnitude = cv.magnitude(fft.getRegion(new cv.Rect(0, 0, fft.cols, fft.rows)))
  
  // Analyze frequency distribution
  const highFreqEnergy = cv.sum(magnitude.getRegion(new cv.Rect(fft.cols/4, fft.rows/4, fft.cols/2, fft.rows/2)))[0]
  const totalEnergy = cv.sum(magnitude)[0]
  const freqRatio = highFreqEnergy / totalEnergy
  
  // Pattern classification based on features
  if (edgeDensity < 0.01) return 'solid'
  if (freqRatio > 0.3) return 'geometric'
  if (edgeDensity > 0.05) return 'striped'
  
  return 'solid' // Default
}

async function classifyFabric(image: cv.Mat): Promise<string> {
  // Convert to grayscale
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY)
  
  // Calculate texture features using Local Binary Patterns
  const lbp = calculateLBP(gray)
  
  // Calculate texture statistics
  const textureVariance = cv.meanStdDev(lbp)[1][0]
  const smoothness = 1 / (1 + textureVariance)
  
  // Fabric classification based on texture
  if (smoothness > 0.8) return 'silk'
  if (smoothness > 0.6) return 'cotton'
  if (smoothness > 0.4) return 'wool'
  if (smoothness > 0.2) return 'denim'
  
  return 'cotton' // Default
}

function calculateLBP(image: cv.Mat): cv.Mat {
  const lbp = cv.Mat.zeros(image.size(), cv.CV_8UC1)
  
  for (let y = 1; y < image.rows - 1; y++) {
    for (let x = 1; x < image.cols - 1; x++) {
      const center = image.at(y, x)
      let code = 0
      
      // 8-neighbor LBP
      const neighbors = [
        image.at(y-1, x-1), image.at(y-1, x), image.at(y-1, x+1),
        image.at(y, x+1), image.at(y+1, x+1), image.at(y+1, x),
        image.at(y+1, x-1), image.at(y, x-1)
      ]
      
      for (let i = 0; i < 8; i++) {
        if (neighbors[i] >= center) {
          code |= (1 << i)
        }
      }
      
      lbp.set(y, x, code)
    }
  }
  
  return lbp
}

async function classifyCategory(image: cv.Mat): Promise<string> {
  // This would typically use a pre-trained CNN model
  // For now, return a placeholder based on image dimensions
  const aspectRatio = image.cols / image.rows
  
  if (aspectRatio > 1.5) return 'pants'
  if (aspectRatio < 0.7) return 'dress'
  if (aspectRatio > 0.8 && aspectRatio < 1.2) return 'shirt'
  
  return 'unknown'
}

export function getColorName(colorCode: string): string {
  return COLOR_NAMES[colorCode] || colorCode
}

export function getPatternName(patternCode: string): string {
  return patternCode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function getFabricName(fabricCode: string): string {
  return fabricCode.charAt(0).toUpperCase() + fabricCode.slice(1)
}
