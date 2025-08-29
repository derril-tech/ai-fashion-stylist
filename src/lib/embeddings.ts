import { monitorImageProcessing } from './observability'

export interface EmbeddingVector {
  clip: number[]
  colorLab: number[]
  style: number[]
}

export interface SimilarityResult {
  itemId: string
  similarity: number
  distance: number
}

// Mock CLIP embedding function (in production, this would use the actual CLIP model)
export async function generateCLIPEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const startTime = performance.now()
  
  try {
    // Simulate CLIP embedding generation
    // In production, this would use a pre-trained CLIP model
    const embedding = Array.from({ length: 768 }, () => Math.random() - 0.5)
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    const normalizedEmbedding = embedding.map(val => val / magnitude)
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('clip_embedding', imageBuffer.length, duration, true)
    
    return normalizedEmbedding
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('clip_embedding', imageBuffer.length, duration, false)
    throw error
  }
}

// Generate color embedding in LAB color space
export async function generateColorEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const startTime = performance.now()
  
  try {
    // Simulate color analysis
    // In production, this would analyze the dominant colors in LAB space
    const colorEmbedding = [
      Math.random() * 100, // L (lightness)
      Math.random() * 200 - 100, // A (green-red)
      Math.random() * 200 - 100  // B (blue-yellow)
    ]
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('color_embedding', imageBuffer.length, duration, true)
    
    return colorEmbedding
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('color_embedding', imageBuffer.length, duration, false)
    throw error
  }
}

// Generate style embedding (fashion-specific features)
export async function generateStyleEmbedding(
  imageBuffer: Buffer,
  attributes: {
    category: string
    colors: string[]
    pattern: string
    fabric: string
  }
): Promise<number[]> {
  const startTime = performance.now()
  
  try {
    // Create a 128-dimensional style embedding based on attributes
    const styleEmbedding = new Array(128).fill(0)
    
    // Encode category (one-hot encoding for top categories)
    const categories = ['shirt', 'pants', 'dress', 'skirt', 'jacket', 'shoes', 'bag']
    const categoryIndex = categories.indexOf(attributes.category)
    if (categoryIndex >= 0) {
      styleEmbedding[categoryIndex] = 1
    }
    
    // Encode colors (one-hot encoding for common colors)
    const commonColors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray']
    attributes.colors.forEach(color => {
      const colorIndex = commonColors.indexOf(color)
      if (colorIndex >= 0) {
        styleEmbedding[10 + colorIndex] = 1
      }
    })
    
    // Encode pattern
    const patterns = ['solid', 'striped', 'polka_dot', 'floral', 'geometric', 'plaid']
    const patternIndex = patterns.indexOf(attributes.pattern)
    if (patternIndex >= 0) {
      styleEmbedding[20 + patternIndex] = 1
    }
    
    // Encode fabric
    const fabrics = ['cotton', 'polyester', 'wool', 'silk', 'denim', 'leather']
    const fabricIndex = fabrics.indexOf(attributes.fabric)
    if (fabricIndex >= 0) {
      styleEmbedding[26 + fabricIndex] = 1
    }
    
    // Add some random features for the remaining dimensions
    for (let i = 32; i < 128; i++) {
      styleEmbedding[i] = Math.random() - 0.5
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(styleEmbedding.reduce((sum, val) => sum + val * val, 0))
    const normalizedEmbedding = styleEmbedding.map(val => val / magnitude)
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('style_embedding', imageBuffer.length, duration, true)
    
    return normalizedEmbedding
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('style_embedding', imageBuffer.length, duration, false)
    throw error
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Calculate Euclidean distance between two vectors
export function euclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let sum = 0
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i]
    sum += diff * diff
  }
  
  return Math.sqrt(sum)
}

// Find similar items based on embeddings
export function findSimilarItems(
  queryEmbedding: EmbeddingVector,
  itemEmbeddings: Array<{
    itemId: string
    embedding: EmbeddingVector
  }>,
  limit: number = 10
): SimilarityResult[] {
  const results: SimilarityResult[] = []
  
  for (const item of itemEmbeddings) {
    // Calculate combined similarity score
    const clipSimilarity = cosineSimilarity(queryEmbedding.clip, item.embedding.clip)
    const colorSimilarity = cosineSimilarity(queryEmbedding.colorLab, item.embedding.colorLab)
    const styleSimilarity = cosineSimilarity(queryEmbedding.style, item.embedding.style)
    
    // Weighted combination (CLIP is most important, then style, then color)
    const combinedSimilarity = 0.5 * clipSimilarity + 0.3 * styleSimilarity + 0.2 * colorSimilarity
    
    // Calculate distance for ranking
    const clipDistance = euclideanDistance(queryEmbedding.clip, item.embedding.clip)
    const colorDistance = euclideanDistance(queryEmbedding.colorLab, item.embedding.colorLab)
    const styleDistance = euclideanDistance(queryEmbedding.style, item.embedding.style)
    
    const combinedDistance = 0.5 * clipDistance + 0.3 * styleDistance + 0.2 * colorDistance
    
    results.push({
      itemId: item.itemId,
      similarity: combinedSimilarity,
      distance: combinedDistance
    })
  }
  
  // Sort by similarity (descending) and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

// Find duplicate items based on similarity threshold
export function findDuplicates(
  itemEmbeddings: Array<{
    itemId: string
    embedding: EmbeddingVector
  }>,
  similarityThreshold: number = 0.9
): Array<{
  itemId1: string
  itemId2: string
  similarity: number
}> {
  const duplicates: Array<{
    itemId1: string
    itemId2: string
    similarity: number
  }> = []
  
  for (let i = 0; i < itemEmbeddings.length; i++) {
    for (let j = i + 1; j < itemEmbeddings.length; j++) {
      const similarity = cosineSimilarity(
        itemEmbeddings[i].embedding.clip,
        itemEmbeddings[j].embedding.clip
      )
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          itemId1: itemEmbeddings[i].itemId,
          itemId2: itemEmbeddings[j].itemId,
          similarity
        })
      }
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity)
}

// Generate embeddings for a clothing item
export async function generateItemEmbeddings(
  imageBuffer: Buffer,
  attributes: {
    category: string
    colors: string[]
    pattern: string
    fabric: string
  }
): Promise<EmbeddingVector> {
  const [clipEmbedding, colorEmbedding, styleEmbedding] = await Promise.all([
    generateCLIPEmbedding(imageBuffer),
    generateColorEmbedding(imageBuffer),
    generateStyleEmbedding(imageBuffer, attributes)
  ])
  
  return {
    clip: clipEmbedding,
    colorLab: colorEmbedding,
    style: styleEmbedding
  }
}
