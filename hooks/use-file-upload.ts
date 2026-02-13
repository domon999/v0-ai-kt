'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface FileUploadState {
  isUploading: boolean
  progress: number
  url: string | null
  error: string | null
}

export interface UseFileUploadOptions {
  maxSize?: number // bytes
  acceptedTypes?: string[]
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
  endpoint?: string
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { toast } = useToast()
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    onSuccess,
    onError,
    endpoint = '/api/upload',
  } = options

  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    url: null,
    error: null,
  })

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `不支持的文件类型。支持: ${acceptedTypes.join(', ')}`,
        }
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
        return {
          valid: false,
          error: `文件大小超过限制 (最大 ${maxSizeMB}MB)`,
        }
      }

      return { valid: true }
    },
    [acceptedTypes, maxSize]
  )

  const upload = useCallback(
    async (file: File): Promise<string> => {
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        setState((prev) => ({ ...prev, error: validation.error! }))
        toast({ description: validation.error, variant: 'destructive' })
        throw new Error(validation.error)
      }

      setState({
        isUploading: true,
        progress: 0,
        url: null,
        error: null,
      })

      try {
        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setState((prev) => ({ ...prev, progress }))
          }
        })

        // Handle response
        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText)
                if (response.success && response.data?.url) {
                  resolve(response.data.url)
                } else {
                  reject(new Error(response.error || '上传失败'))
                }
              } catch (error) {
                reject(new Error('响应解析失败'))
              }
            } else {
              reject(new Error(`上传失败: ${xhr.statusText}`))
            }
          }

          xhr.onerror = () => reject(new Error('网络错误'))
          xhr.ontimeout = () => reject(new Error('上传超时'))

          xhr.open('POST', endpoint)
          xhr.timeout = 60000 // 60s timeout
          xhr.send(formData)
        })

        const url = await uploadPromise

        setState({
          isUploading: false,
          progress: 100,
          url,
          error: null,
        })

        toast({ description: '上传成功' })
        onSuccess?.(url)
        return url
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        setState({
          isUploading: false,
          progress: 0,
          url: null,
          error: errorMessage,
        })

        toast({ description: errorMessage, variant: 'destructive' })
        onError?.(errorMessage)
        throw error
      }
    },
    [endpoint, validateFile, onSuccess, onError, toast]
  )

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      url: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    upload,
    validateFile,
    reset,
  }
}
