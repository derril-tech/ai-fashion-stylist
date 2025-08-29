import { NextRequest, NextResponse } from 'next/server'
import { createPresignedUploadUrl, generateS3Key } from '@/lib/s3'
import { isValidImageFile } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, userId } = await request.json()

    // Validate file type
    if (!isValidImageFile({ name: filename, type: contentType, size: 0 })) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Generate S3 key
    const key = generateS3Key(userId, filename)

    // Create presigned URL
    const presignedUrl = await createPresignedUploadUrl(key, contentType)

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Upload URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
