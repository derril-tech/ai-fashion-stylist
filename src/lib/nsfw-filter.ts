import { NSFWJS } from 'nsfwjs'

let nsfwModel: NSFWJS | null = null

export async function loadNSFWModel(): Promise<NSFWJS> {
  if (!nsfwModel) {
    nsfwModel = await NSFWJS.load()
  }
  return nsfwModel
}

export interface NSFWResult {
  isSafe: boolean
  confidence: number
  categories: {
    Drawing: number
    Hentai: number
    Neutral: number
    Porn: number
    Sexy: number
  }
}

export async function checkNSFW(imageElement: HTMLImageElement): Promise<NSFWResult> {
  try {
    const model = await loadNSFWModel()
    const predictions = await model.classify(imageElement)
    
    const categories = {
      Drawing: 0,
      Hentai: 0,
      Neutral: 0,
      Porn: 0,
      Sexy: 0,
    }
    
    predictions.forEach((prediction) => {
      categories[prediction.className as keyof typeof categories] = prediction.probability
    })
    
    // Consider content unsafe if porn or hentai probability > 0.5
    const isSafe = categories.Porn < 0.5 && categories.Hentai < 0.5
    const confidence = Math.max(categories.Porn, categories.Hentai)
    
    return {
      isSafe,
      confidence,
      categories,
    }
  } catch (error) {
    console.error('NSFW check error:', error)
    // Default to safe if check fails
    return {
      isSafe: true,
      confidence: 0,
      categories: {
        Drawing: 0,
        Hentai: 0,
        Neutral: 1,
        Porn: 0,
        Sexy: 0,
      },
    }
  }
}

export function shouldBlockContent(result: NSFWResult): boolean {
  return !result.isSafe && result.confidence > 0.7
}
