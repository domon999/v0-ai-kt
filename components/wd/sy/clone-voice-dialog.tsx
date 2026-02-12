'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CloneVoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CloneVoiceDialog({ open, onOpenChange, onSuccess }: CloneVoiceDialogProps) {
  const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isCloning, setIsCloning] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({ title: '错误', description: '请上传音频文件', variant: 'destructive' })
        return
      }
      setAudioFile(file)
    }
  }

  const handleClone = async () => {
    if (!voiceName || !audioFile) {
      toast({ title: '错误', description: '请填写声音名称并上传音频', variant: 'destructive' })
      return
    }

    setIsCloning(true)
    try {
      // 上传音频文件
      const formData = new FormData()
      formData.append('file', audioFile)
      
      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error('上传失败')
      
      const { url: audioUrl } = await uploadRes.json()

      // 调用克隆 API
      const cloneRes = await fetch('/api/minimax/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName, audioUrl }),
      })

      if (!cloneRes.ok) {
        const error = await cloneRes.json()
        throw new Error(error.error || '克隆失败')
      }

      toast({ title: '成功', description: '声音克隆成功！已消耗 1200 积分' })
      onSuccess()
      onOpenChange(false)
      setVoiceName('')
      setAudioFile(null)
    } catch (error) {
      toast({
        title: '克隆失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsCloning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>克隆声音</DialogTitle>
          <DialogDescription>
            上传一段音频文件（至少10秒），系统将克隆您的声音特征
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="voiceName">声音名称</Label>
            <Input
              id="voiceName"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="例如：我的声音"
            />
          </div>

          <div>
            <Label htmlFor="audioFile">音频文件</Label>
            <div className="mt-2">
              <Input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {audioFile && (
              <p className="text-sm text-muted-foreground mt-2">
                已选择：{audioFile.name}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">提示：</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>音频时长至少 10 秒，建议 30-60 秒</li>
              <li>支持 MP3、WAV、M4A 等格式</li>
              <li>声音清晰，背景噪音少效果更好</li>
              <li>克隆需消耗 1200 积分</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleClone} disabled={isCloning}>
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                克隆中...
              </>
            ) : (
              '开始克隆'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
