import Tesseract from 'tesseract.js'
import cv from '@u4/opencv4nodejs'
import { monitorImageProcessing } from './observability'

export interface OCRResult {
  text: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface SizeTagInfo {
  size: string
  brand: string
  confidence: number
}

// Common size patterns
const SIZE_PATTERNS = [
  /(\d{1,2})/g, // Numbers like 8, 10, 12
  /(XS|S|M|L|XL|XXL|XXXL)/gi, // Letter sizes
  /(\d{1,2}\/\d{1,2})/g, // Fractions like 8/10
  /(\d{1,2}W)/gi, // Width sizes like 32W
  /(\d{1,2}L)/gi, // Length sizes like 32L
  /(\d{1,2}W\s*\d{1,2}L)/gi, // Width x Length like 32W 34L
]

// Common brand patterns
const BRAND_PATTERNS = [
  /(nike|adidas|puma|reebok|converse|vans)/gi,
  /(levi's|levis|lee|wrangler)/gi,
  /(zara|h&m|uniqlo|gap|old navy)/gi,
  /(gucci|prada|louis vuitton|lv|chanel)/gi,
  /(calvin klein|ck|tommy hilfiger|ralph lauren)/gi,
  /(north face|patagonia|columbia|timberland)/gi,
]

export async function extractSizeTagInfo(
  imageBuffer: Buffer,
  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
): Promise<SizeTagInfo> {
  const startTime = performance.now()
  
  try {
    // Preprocess image for better OCR
    const processedImage = await preprocessImageForOCR(imageBuffer, regionOfInterest)
    
    // Perform OCR
    const result = await Tesseract.recognize(processedImage, 'eng', {
      logger: m => console.log(m)
    })
    
    const extractedText = result.data.text.toLowerCase()
    
    // Extract size information
    const size = extractSize(extractedText)
    
    // Extract brand information
    const brand = extractBrand(extractedText)
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('ocr_extraction', imageBuffer.length, duration, true)
    
    return {
      size: size || 'unknown',
      brand: brand || 'unknown',
      confidence: result.data.confidence / 100
    }
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('ocr_extraction', imageBuffer.length, duration, false)
    
    return {
      size: 'unknown',
      brand: 'unknown',
      confidence: 0
    }
  }
}

async function preprocessImageForOCR(
  imageBuffer: Buffer,
  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
): Promise<Buffer> {
  const image = cv.imdecode(imageBuffer)
  
  // Crop to region of interest if provided
  let croppedImage = image
  if (regionOfInterest) {
    const roi = new cv.Rect(
      regionOfInterest.x,
      regionOfInterest.y,
      regionOfInterest.width,
      regionOfInterest.height
    )
    croppedImage = image.getRegion(roi)
  }
  
  // Convert to grayscale
  const gray = croppedImage.cvtColor(cv.COLOR_BGR2GRAY)
  
  // Apply Gaussian blur to reduce noise
  const blurred = gray.gaussianBlur(new cv.Size(3, 3), 0)
  
  // Apply adaptive thresholding
  const thresholded = blurred.adaptiveThreshold(
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    11,
    2
  )
  
  // Apply morphological operations to clean up text
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2))
  const cleaned = thresholded.morphologyEx(kernel, cv.MORPH_CLOSE)
  
  // Resize for better OCR accuracy
  const resized = cleaned.resize(new cv.Size(0, 0), 2, 2, cv.INTER_CUBIC)
  
  return cv.imencode('.png', resized)
}

function extractSize(text: string): string | null {
  for (const pattern of SIZE_PATTERNS) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      // Return the first match, prioritizing letter sizes
      const letterSizes = matches.filter(match => /^[A-Z]+$/i.test(match))
      if (letterSizes.length > 0) {
        return letterSizes[0].toUpperCase()
      }
      return matches[0]
    }
  }
  return null
}

function extractBrand(text: string): string | null {
  for (const pattern of BRAND_PATTERNS) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return matches[0].toLowerCase()
    }
  }
  return null
}

export async function detectTextRegions(
  imageBuffer: Buffer
): Promise<OCRResult[]> {
  const image = cv.imdecode(imageBuffer)
  
  // Convert to grayscale
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY)
  
  // Apply MSER (Maximally Stable Extremal Regions) for text detection
  const mser = new cv.MSER()
  const regions = mser.detectRegions(gray)
  
  const textRegions: OCRResult[] = []
  
  for (const region of regions) {
    // Filter regions by size and aspect ratio
    const rect = cv.boundingRect(region)
    const aspectRatio = rect.width / rect.height
    const area = rect.width * rect.height
    
    // Text regions typically have aspect ratios between 0.1 and 10
    // and reasonable areas
    if (aspectRatio > 0.1 && aspectRatio < 10 && area > 100 && area < 10000) {
      // Extract the region
      const roi = image.getRegion(rect)
      
      // Perform OCR on this region
      try {
        const result = await Tesseract.recognize(cv.imencode('.png', roi), 'eng', {
          logger: m => console.log(m)
        })
        
        if (result.data.text.trim().length > 0) {
          textRegions.push({
            text: result.data.text.trim(),
            confidence: result.data.confidence / 100,
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          })
        }
      } catch (error) {
        // Skip regions that fail OCR
        continue
      }
    }
  }
  
  return textRegions
}

export function normalizeSize(size: string): string {
  // Normalize size strings to standard format
  const normalized = size.trim().toUpperCase()
  
  // Handle common variations
  const sizeMap: Record<string, string> = {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
    'XXXL': 'XXXL',
    '0': 'XS',
    '2': 'XS',
    '4': 'S',
    '6': 'S',
    '8': 'M',
    '10': 'M',
    '12': 'L',
    '14': 'L',
    '16': 'XL',
    '18': 'XXL',
    '20': 'XXL',
  }
  
  return sizeMap[normalized] || normalized
}

export function normalizeBrand(brand: string): string {
  // Normalize brand names to standard format
  const normalized = brand.trim().toLowerCase()
  
  // Handle common variations
  const brandMap: Record<string, string> = {
    'levis': 'Levi\'s',
    'levi\'s': 'Levi\'s',
    'calvin klein': 'Calvin Klein',
    'ck': 'Calvin Klein',
    'tommy hilfiger': 'Tommy Hilfiger',
    'ralph lauren': 'Ralph Lauren',
    'louis vuitton': 'Louis Vuitton',
    'lv': 'Louis Vuitton',
    'north face': 'The North Face',
    'nike': 'Nike',
    'adidas': 'Adidas',
    'puma': 'Puma',
    'reebok': 'Reebok',
    'converse': 'Converse',
    'vans': 'Vans',
  }
  
  return brandMap[normalized] || brand.charAt(0).toUpperCase() + brand.slice(1)
}
