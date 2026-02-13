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
import { useCredits } from '@/hooks/use-credits'
import { useToast } from '@/hooks/use-toast'

interface VoiceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function VoiceUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: VoiceUploadDialogProps) {
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { upload, isUploading, progress } = useFileUpload()
  const { hasEnoughCredits } = useCredits()
  const { toast } = useToast()

  const requiredCredits = 1200

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !name.trim()) {
      toast({ description: '请填写完整信息', variant: 'destructive' })
      return
    }

    // Check credits
    const hasCredits = await hasEnoughCredits(requiredCredits)
    if (!hasCredits) {
      toast({
        title: '积分不足',
        description: `声音克隆需要 ${requiredCredits} 积分，请先充值`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Upload audio file
      const uploadResult = await upload(selectedFile, {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'],
      })

      if (!uploadResult.success || !uploadResult.url) {
        toast({
          description: uploadResult.error || '文件上传失败',
          variant: 'destructive',
        })
        return
      }

      // Create voice clone
      const response = await fetch('/api/voices/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          audio_url: uploadResult.url,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({ description: '声音克隆任务已提交，请稍后查看结果' })
        setName('')
        setSelectedFile(null)
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          description: data.error || '声音克隆失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[v0] Voice clone error:', error)
      toast({ description: '提交失败，请重试', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>克隆声音</DialogTitle>
          <DialogDescription>
            上传至少10秒的清晰音频，系统将克隆您的声音模型（消耗 {requiredCredits} 积分）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">声音名称</Label>
            <Input
              id="name"
              placeholder="例如：我的声音"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio">音频文件</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={isSubmitting || isUploading}
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedFile.name}
                </span>
              )}
            </div>
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
            {isSubmitting ? '提交中...' : isUploading ? '上传中...' : '开始克隆'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
