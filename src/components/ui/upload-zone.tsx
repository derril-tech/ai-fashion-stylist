"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isValidImageFile } from '@/lib/utils'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  className?: string
}

export function UploadZone({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: UploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle accepted files
      const validFiles = acceptedFiles.filter((file) => isValidImageFile(file))
      setUploadedFiles((prev) => [...prev, ...validFiles])
      onFilesSelected(validFiles)

      // Handle rejected files
      const newErrors: string[] = []
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            newErrors.push(`${file.name} is too large. Max size is ${maxSize / 1024 / 1024}MB`)
          } else if (error.code === 'file-invalid-type') {
            newErrors.push(`${file.name} is not a valid image file`)
          } else {
            newErrors.push(`${file.name}: ${error.message}`)
          }
        })
      })
      setErrors((prev) => [...prev, ...newErrors])
    },
    [maxSize, onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles,
    maxSize,
  })

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeError = (index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-fashion-purple bg-fashion-purple/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Drop your images here' : 'Drag & drop images here'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to select files
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPEG, PNG, WebP • Max {maxSize / 1024 / 1024}MB per file • Up to {maxFiles} files
        </p>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group bg-muted rounded-lg p-2"
              >
                <div className="aspect-square bg-background rounded overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-destructive">Upload Errors</h3>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-lg p-2"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
                <button
                  onClick={() => removeError(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {uploadedFiles.length > 0 && (
        <Button
          onClick={() => onFilesSelected(uploadedFiles)}
          className="w-full fashion-gradient"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Process {uploadedFiles.length} File{uploadedFiles.length !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  )
}
