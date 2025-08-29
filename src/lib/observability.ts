import { trace, metrics, context } from '@opentelemetry/api'
import * as Sentry from '@sentry/nextjs'

// OpenTelemetry setup
const tracer = trace.getTracer('ai-fashion-stylist')
const meter = metrics.getMeter('ai-fashion-stylist')

// Custom metrics
const uploadCounter = meter.createCounter('uploads_total', {
  description: 'Total number of uploads',
})

const processingTimeHistogram = meter.createHistogram('processing_time_seconds', {
  description: 'Time spent processing images',
  unit: 's',
})

const errorCounter = meter.createCounter('errors_total', {
  description: 'Total number of errors',
})

// Utility functions
export function startSpan(name: string, attributes?: Record<string, any>) {
  return tracer.startSpan(name, { attributes })
}

export function recordUpload(userId: string, fileCount: number) {
  uploadCounter.add(fileCount, { user_id: userId })
}

export function recordProcessingTime(duration: number, operation: string) {
  processingTimeHistogram.record(duration, { operation })
}

export function recordError(error: Error, context?: Record<string, any>) {
  errorCounter.add(1, { 
    error_type: error.name,
    error_message: error.message,
    ...context 
  })
  
  // Send to Sentry
  Sentry.captureException(error, {
    extra: context,
  })
}

// Performance monitoring
export function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  return fn().finally(() => {
    const duration = (performance.now() - startTime) / 1000
    recordProcessingTime(duration, operation)
  })
}

// User activity tracking
export function trackUserActivity(action: string, userId: string, metadata?: Record<string, any>) {
  const span = startSpan(`user.${action}`, {
    user_id: userId,
    action,
    ...metadata,
  })
  
  span.end()
}

// API request monitoring
export function monitorAPIRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number
) {
  const span = startSpan('api.request', {
    method,
    path,
    status_code: statusCode,
    duration,
  })
  
  span.end()
}

// Database query monitoring
export function monitorDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  success: boolean
) {
  const span = startSpan('db.query', {
    operation,
    table,
    duration,
    success,
  })
  
  span.end()
}

// Image processing monitoring
export function monitorImageProcessing(
  operation: 'upload' | 'face_blur' | 'nsfw_check' | 'segmentation',
  fileSize: number,
  duration: number,
  success: boolean
) {
  const span = startSpan('image.processing', {
    operation,
    file_size: fileSize,
    duration,
    success,
  })
  
  span.end()
}
