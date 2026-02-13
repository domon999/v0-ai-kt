'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Play, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Voice {
  id: string
  voice_name: string
  voice_id: string
  audio_url: string
  created_at: string
}

interface Step2Props {
  voices: Voice[]
  selectedVoiceId: string | null
  text: string
  onSelectVoice: (id: string) => void
  onTextChange: (text: string) => void
}

export function Step2VoiceText({
  voices,
  selectedVoiceId,
  text,
  onSelectVoice,
  onTextChange,
}: Step2Props) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<string | null>(null)

  const textLength = text.length
  const estimatedCredits = Math.ceil(textLength / 100) * 10

  const handlePreview = async () => {
    if (!selectedVoiceId || !text.trim()) {
      toast.error('请选择声音并输入文案')
      return
    }

    setPreviewLoading(true)
    try {
      const res = await fetch('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: voices.find((v) => v.id === selectedVoiceId)?.voice_id,
          text,
        }),
      })

      if (!res.ok) throw new Error('预览失败')

      const data = await res.json()
      setPreviewAudio(data.audio_url)
      toast.success('语音预览生成成功')
    } catch (error) {
      toast.error('生成预览失败，请稍后重试')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (voices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>选择声音和输入文案</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mic className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              暂无可用的声音模型，请先在声音管理页面克隆声音
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>选择声音模型</CardTitle>
          <p className="text-sm text-muted-foreground">选择您克隆的声音用于生成语音</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedVoiceId === voice.id
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSelectVoice(voice.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{voice.voice_name}</span>
                  </div>
                  {selectedVoiceId === voice.id && <Check className="h-4 w-4 text-primary" />}
                </div>
                <audio src={voice.audio_url} controls className="mt-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>输入口播文案</CardTitle>
          <p className="text-sm text-muted-foreground">输入数字人要说的内容</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="text">文案内容</Label>
              <span className="text-xs text-muted-foreground">
                {textLength} 字 · 预计 {estimatedCredits} 积分
              </span>
            </div>
            <Textarea
              id="text"
              placeholder="请输入口播文案内容..."
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreview}
              disabled={!selectedVoiceId || !text.trim() || previewLoading}
              variant="outline"
            >
              {previewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  预览语音
                </>
              )}
            </Button>
            {previewAudio && (
              <div className="flex-1">
                <audio src={previewAudio} controls className="w-full" />
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">积分说明</p>
                <p className="mt-1">TTS 生成按文本长度计费，约 10 积分/100字</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
