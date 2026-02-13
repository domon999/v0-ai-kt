'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface BackgroundUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BackgroundUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: BackgroundUploadDialogProps) {
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { upload, isUploading, progress } = useFileUpload()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ''))
      }
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !name.trim()) {
      toast({ description: '请填写完整信息', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      // Upload image file
      const uploadResult = await upload(selectedFile, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      })

      if (!uploadResult.success || !uploadResult.url) {
        toast({
          description: uploadResult.error || '文件上传失败',
          variant: 'destructive',
        })
        return
      }

      // Save background record
      const response = await fetch('/api/backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          image_url: uploadResult.url,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({ description: '背景图片上传成功' })
        setName('')
        setSelectedFile(null)
        setPreview(null)
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          description: data.error || '保存失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[v0] Background upload error:', error)
      toast({ description: '上传失败，请重试', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传背景图片</DialogTitle>
          <DialogDescription>
            上传高清背景图片，用于口播视频合成
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">背景名称</Label>
            <Input
              id="name"
              placeholder="例如：办公室背景"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">图片文件</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isSubmitting || isUploading}
            />
            {isUploading && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  上传中... {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>预览</Label>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={preview}
                  alt="预览"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUploading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !name.trim() || isSubmitting || isUploading}
          >
            {isSubmitting ? '上传中...' : isUploading ? '处理中...' : '确认上传'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
