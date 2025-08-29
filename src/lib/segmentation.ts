import cv from '@u4/opencv4nodejs'
import { monitorImageProcessing } from './observability'

export interface SegmentationResult {
  masks: Buffer[]
  boundingBoxes: Array<{
    x: number
    y: number
    width: number
    height: number
    confidence: number
    class: string
  }>
  processedImage: Buffer
}

export interface ClothingItem {
  id: string
  mask: Buffer
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  category: string
  color: string
}

// Clothing categories for YOLO model
const CLOTHING_CATEGORIES = [
  'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'blouse',
  'jeans', 'shorts', 't-shirt', 'hoodie', 'cardigan', 'blazer', 'suit',
  'shoes', 'boots', 'sneakers', 'heels', 'flats', 'sandals',
  'bag', 'purse', 'backpack', 'handbag', 'clutch',
  'hat', 'cap', 'beanie', 'scarf', 'belt', 'jewelry'
]

export async function segmentClothingItems(
  imageBuffer: Buffer,
  confidenceThreshold: number = 0.5
): Promise<SegmentationResult> {
  const startTime = performance.now()
  
  try {
    // Load image
    const image = cv.imdecode(imageBuffer)
    
    // Load YOLO model (you'll need to download the weights)
    const net = cv.readNetFromDarknet(
      'models/yolo-seg.cfg',
      'models/yolo-seg.weights'
    )
    
    // Set input blob
    const blob = cv.blobFromImage(
      image,
      1/255.0,
      new cv.Size(640, 640),
      new cv.Vec3(0, 0, 0),
      true,
      false
    )
    
    net.setInput(blob)
    
    // Forward pass
    const outputs = net.forward()
    
    // Process detections
    const detections = processDetections(outputs, image.size(), confidenceThreshold)
    
    // Generate masks
    const masks = await generateMasks(detections, image)
    
    // Create processed image with bounding boxes
    const processedImage = drawDetections(image, detections)
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('segmentation', imageBuffer.length, duration, true)
    
    return {
      masks,
      boundingBoxes: detections.map(d => ({
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        confidence: d.confidence,
        class: d.class
      })),
      processedImage: cv.imencode('.jpg', processedImage)
    }
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('segmentation', imageBuffer.length, duration, false)
    throw error
  }
}

function processDetections(
  outputs: cv.Mat[],
  imageSize: cv.Size,
  confidenceThreshold: number
) {
  const detections: Array<{
    x: number
    y: number
    width: number
    height: number
    confidence: number
    class: string
  }> = []
  
  // Process detection outputs
  const detectionOutput = outputs[0]
  const maskOutput = outputs[1]
  
  for (let i = 0; i < detectionOutput.rows; i++) {
    const confidence = detectionOutput.at(i, 4)
    
    if (confidence > confidenceThreshold) {
      const classId = detectionOutput.at(i, 5)
      const category = CLOTHING_CATEGORIES[classId] || 'unknown'
      
      // Get bounding box coordinates
      const centerX = detectionOutput.at(i, 0) * imageSize.width
      const centerY = detectionOutput.at(i, 1) * imageSize.height
      const width = detectionOutput.at(i, 2) * imageSize.width
      const height = detectionOutput.at(i, 3) * imageSize.height
      
      detections.push({
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        confidence,
        class: category
      })
    }
  }
  
  return detections
}

async function generateMasks(
  detections: any[],
  image: cv.Mat
): Promise<Buffer[]> {
  const masks: Buffer[] = []
  
  for (const detection of detections) {
    // Create mask for the detected region
    const mask = cv.Mat.zeros(image.size(), cv.CV_8UC1)
    
    // Fill the bounding box area
    const rect = new cv.Rect(
      Math.floor(detection.x),
      Math.floor(detection.y),
      Math.floor(detection.width),
      Math.floor(detection.height)
    )
    
    mask.getRegion(rect).setTo(new cv.Vec(255))
    
    masks.push(cv.imencode('.png', mask))
  }
  
  return masks
}

function drawDetections(image: cv.Mat, detections: any[]): cv.Mat {
  const result = image.copy()
  
  for (const detection of detections) {
    const rect = new cv.Rect(
      Math.floor(detection.x),
      Math.floor(detection.y),
      Math.floor(detection.width),
      Math.floor(detection.height)
    )
    
    // Draw bounding box
    cv.rectangle(
      result,
      rect,
      new cv.Vec3(0, 255, 0),
      2
    )
    
    // Draw label
    const label = `${detection.class} ${(detection.confidence * 100).toFixed(1)}%`
    const textSize = cv.getTextSize(label, cv.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    
    cv.putText(
      result,
      label,
      new cv.Point2(rect.x, rect.y - 10),
      cv.FONT_HERSHEY_SIMPLEX,
      0.5,
      new cv.Vec3(0, 255, 0),
      1
    )
  }
  
  return result
}

export function removeBackground(imageBuffer: Buffer, maskBuffer: Buffer): Buffer {
  const image = cv.imdecode(imageBuffer)
  const mask = cv.imdecode(maskBuffer, cv.IMREAD_GRAYSCALE)
  
  // Create transparent background
  const result = cv.Mat.zeros(image.size(), cv.CV_8UC4)
  
  // Copy image to result with alpha channel
  const channels = image.splitChannels()
  channels.push(mask)
  cv.merge(channels, result)
  
  return cv.imencode('.png', result)
}
