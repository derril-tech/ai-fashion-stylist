import cv from '@u4/opencv4nodejs'
import { monitorImageProcessing } from './observability'
import { cosineSimilarity, EmbeddingVector } from './embeddings'

export interface DuplicateCluster {
  id: string
  items: Array<{
    itemId: string
    similarity: number
    phashDistance: number
    clipSimilarity: number
  }>
  representativeItem: string
  confidence: number
}

export interface DuplicateGroup {
  primaryItem: string
  duplicateItems: string[]
  mergeReason: string
  confidence: number
}

// Calculate perceptual hash (pHash) for image
export async function calculatePHash(imageBuffer: Buffer): Promise<string> {
  const startTime = performance.now()
  
  try {
    const image = cv.imdecode(imageBuffer)
    
    // Resize to 32x32 for consistent hashing
    const resized = image.resize(new cv.Size(32, 32))
    
    // Convert to grayscale
    const gray = resized.cvtColor(cv.COLOR_BGR2GRAY)
    
    // Apply DCT (Discrete Cosine Transform)
    const floatImage = gray.convertTo(cv.CV_32F)
    const dct = cv.dct(floatImage)
    
    // Take top-left 8x8 block (low frequency components)
    const lowFreq = dct.getRegion(new cv.Rect(0, 0, 8, 8))
    
    // Calculate median
    const median = cv.mean(lowFreq)[0]
    
    // Generate hash
    let hash = ''
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        hash += lowFreq.at(y, x) > median ? '1' : '0'
      }
    }
    
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('phash_calculation', imageBuffer.length, duration, true)
    
    return hash
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000
    monitorImageProcessing('phash_calculation', imageBuffer.length, duration, false)
    throw error
  }
}

// Calculate Hamming distance between two pHash strings
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must be equal')
  }
  
  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++
    }
  }
  
  return distance
}

// Simple clustering algorithm (in production, use HDBSCAN)
export function clusterSimilarItems(
  items: Array<{
    itemId: string
    phash: string
    embedding: EmbeddingVector
  }>,
  phashThreshold: number = 10,
  clipThreshold: number = 0.8
): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = []
  const processed = new Set<string>()
  
  for (let i = 0; i < items.length; i++) {
    if (processed.has(items[i].itemId)) continue
    
    const cluster: DuplicateCluster = {
      id: `cluster_${clusters.length}`,
      items: [{
        itemId: items[i].itemId,
        similarity: 1.0,
        phashDistance: 0,
        clipSimilarity: 1.0
      }],
      representativeItem: items[i].itemId,
      confidence: 1.0
    }
    
    processed.add(items[i].itemId)
    
    // Find similar items
    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(items[j].itemId)) continue
      
      const phashDist = hammingDistance(items[i].phash, items[j].phash)
      const clipSim = cosineSimilarity(items[i].embedding.clip, items[j].embedding.clip)
      
      // Check if items are similar enough
      if (phashDist <= phashThreshold && clipSim >= clipThreshold) {
        cluster.items.push({
          itemId: items[j].itemId,
          similarity: (clipSim + (1 - phashDist / 64)) / 2, // Combined similarity
          phashDistance: phashDist,
          clipSimilarity: clipSim
        })
        processed.add(items[j].itemId)
      }
    }
    
    if (cluster.items.length > 1) {
      // Calculate cluster confidence
      const avgSimilarity = cluster.items.reduce((sum, item) => sum + item.similarity, 0) / cluster.items.length
      cluster.confidence = avgSimilarity
      
      clusters.push(cluster)
    }
  }
  
  return clusters
}

// Find potential duplicates for a specific item
export function findPotentialDuplicates(
  targetItem: {
    itemId: string
    phash: string
    embedding: EmbeddingVector
  },
  allItems: Array<{
    itemId: string
    phash: string
    embedding: EmbeddingVector
  }>,
  phashThreshold: number = 10,
  clipThreshold: number = 0.8
): Array<{
  itemId: string
  similarity: number
  phashDistance: number
  clipSimilarity: number
  mergeReason: string
}> {
  const duplicates: Array<{
    itemId: string
    similarity: number
    phashDistance: number
    clipSimilarity: number
    mergeReason: string
  }> = []
  
  for (const item of allItems) {
    if (item.itemId === targetItem.itemId) continue
    
    const phashDist = hammingDistance(targetItem.phash, item.phash)
    const clipSim = cosineSimilarity(targetItem.embedding.clip, item.embedding.clip)
    
    // Check if items are similar enough
    if (phashDist <= phashThreshold && clipSim >= clipThreshold) {
      const combinedSimilarity = (clipSim + (1 - phashDist / 64)) / 2
      
      let mergeReason = 'High visual similarity'
      if (phashDist <= 5) {
        mergeReason = 'Nearly identical images'
      } else if (clipSim >= 0.95) {
        mergeReason = 'Very similar clothing items'
      }
      
      duplicates.push({
        itemId: item.itemId,
        similarity: combinedSimilarity,
        phashDistance: phashDist,
        clipSimilarity: clipSim,
        mergeReason
      })
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity)
}

// Merge duplicate items
export function mergeDuplicateItems(
  primaryItemId: string,
  duplicateItemIds: string[]
): DuplicateGroup {
  return {
    primaryItem: primaryItemId,
    duplicateItems: duplicateItemIds,
    mergeReason: 'Automatically detected duplicates',
    confidence: 0.9
  }
}

// Calculate duplicate reduction percentage
export function calculateDuplicateReduction(
  originalCount: number,
  afterDedupeCount: number
): number {
  return ((originalCount - afterDedupeCount) / originalCount) * 100
}

// Validate duplicate detection results
export function validateDuplicateDetection(
  clusters: DuplicateCluster[],
  groundTruth: Array<{
    itemId1: string
    itemId2: string
    isDuplicate: boolean
  }>
): {
  precision: number
  recall: number
  f1Score: number
} {
  let truePositives = 0
  let falsePositives = 0
  let falseNegatives = 0
  
  // Create set of predicted duplicate pairs
  const predictedPairs = new Set<string>()
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.items.length; i++) {
      for (let j = i + 1; j < cluster.items.length; j++) {
        const pair = [cluster.items[i].itemId, cluster.items[j].itemId].sort().join('|')
        predictedPairs.add(pair)
      }
    }
  }
  
  // Compare with ground truth
  for (const truth of groundTruth) {
    const pair = [truth.itemId1, truth.itemId2].sort().join('|')
    
    if (truth.isDuplicate && predictedPairs.has(pair)) {
      truePositives++
    } else if (truth.isDuplicate && !predictedPairs.has(pair)) {
      falseNegatives++
    } else if (!truth.isDuplicate && predictedPairs.has(pair)) {
      falsePositives++
    }
  }
  
  const precision = truePositives / (truePositives + falsePositives) || 0
  const recall = truePositives / (truePositives + falseNegatives) || 0
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0
  
  return { precision, recall, f1Score }
}

// Generate dedupe report
export function generateDedupeReport(
  originalItems: number,
  clusters: DuplicateCluster[],
  mergedGroups: DuplicateGroup[]
): {
  totalItems: number
  duplicateClusters: number
  mergedItems: number
  reductionPercentage: number
  averageClusterSize: number
  confidenceScore: number
} {
  const totalDuplicates = clusters.reduce((sum, cluster) => sum + cluster.items.length - 1, 0)
  const mergedItems = mergedGroups.reduce((sum, group) => sum + group.duplicateItems.length, 0)
  const reductionPercentage = calculateDuplicateReduction(originalItems, originalItems - mergedItems)
  const averageClusterSize = clusters.length > 0 ? clusters.reduce((sum, cluster) => sum + cluster.items.length, 0) / clusters.length : 0
  const confidenceScore = clusters.length > 0 ? clusters.reduce((sum, cluster) => sum + cluster.confidence, 0) / clusters.length : 0
  
  return {
    totalItems: originalItems,
    duplicateClusters: clusters.length,
    mergedItems,
    reductionPercentage,
    averageClusterSize,
    confidenceScore
  }
}
