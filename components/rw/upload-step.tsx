'use client'

import { useState } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface UploadStepProps {
  onUploadComplete: (imageUrl: string) => void
}

export function UploadStep({ onUploadComplete }: UploadStepProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      onUploadComplete(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">上传照片</h3>
            <p className="text-sm text-muted-foreground">
              上传一张人物照片，生成专属数字人
            </p>
          </div>

          {preview ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-12 transition-colors hover:border-muted-foreground/50 hover:bg-muted">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">
                点击或拖拽上传
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          )}

          {uploading && (
            <p className="text-center text-sm text-muted-foreground">
              上传中...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
