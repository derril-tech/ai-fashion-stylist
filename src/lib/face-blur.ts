import cv from '@u4/opencv4nodejs'

export interface FaceBlurOptions {
  blurRadius?: number
  confidence?: number
}

export async function blurFaces(
  imageBuffer: Buffer,
  options: FaceBlurOptions = {}
): Promise<Buffer> {
  const { blurRadius = 15, confidence = 0.5 } = options

  try {
    // Load image from buffer
    const image = cv.imdecode(imageBuffer)
    
    // Convert to RGB for face detection
    const rgbImage = image.cvtColor(cv.COLOR_BGR2RGB)
    
    // Load face detection model (you'll need to download this)
    const faceCascade = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2)
    
    // Detect faces
    const faces = faceCascade.detectMultiScale(rgbImage, {
      scaleFactor: 1.1,
      minNeighbors: 5,
      minSize: new cv.Size(30, 30),
    })
    
    // Blur detected faces
    faces.forEach((face) => {
      const [x, y, width, height] = face
      const faceRegion = image.getRegion(new cv.Rect(x, y, width, height))
      
      // Apply Gaussian blur
      const blurredFace = faceRegion.gaussianBlur(new cv.Size(blurRadius, blurRadius), 0)
      
      // Replace the face region with blurred version
      blurredFace.copyTo(image.getRegion(new cv.Rect(x, y, width, height)))
    })
    
    // Convert back to buffer
    return cv.imencode('.jpg', image)
  } catch (error) {
    console.error('Face blur error:', error)
    // Return original image if face blur fails
    return imageBuffer
  }
}

export function shouldBlurFaces(userPreference: boolean = true): boolean {
  // Default to blurring faces unless user explicitly opts out
  return userPreference
}
