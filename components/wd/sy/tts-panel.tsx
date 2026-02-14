'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AudioPlayer } from './audio-player'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Voice {
  id: string
  voice_name: string
  voice_id: string
}

interface TTSPanelProps {
  voices: Voice[]
}

export function TTSPanel({ voices }: TTSPanelProps) {
  const [text, setText] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const estimatedCredits = Math.ceil(text.length / 100) * 10

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ title: '错误', description: '请输入要转换的文本', variant: 'destructive' })
      return
    }

    if (!selectedVoiceId) {
      toast({ title: '错误', description: '请选择声音模型', variant: 'destructive' })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '生成失败')
      }

      const data = await response.json()
      setAudioUrl(data.audioUrl)
      toast({
        title: '成功',
        description: `语音生成成功！已消耗 ${data.creditsUsed} 积分`,
      })
    } catch (error) {
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>文字转语音 (TTS)</CardTitle>
        <CardDescription>
          输入文本，使用您克隆的声音生成语音
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
            <SelectTrigger>
              <SelectValue placeholder="选择声音模型" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.voice_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Textarea
            placeholder="请输入要转换的文本..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{text.length} 字</span>
            <span>预计消耗 {estimatedCredits} 积分</span>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !text.trim() || !selectedVoiceId}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            '生成语音'
          )}
        </Button>

        {audioUrl && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">生成的语音：</p>
            <AudioPlayer audioUrl={audioUrl} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
