'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Play, Loader2 } from 'lucide-react'

interface Voice {
  id: string
  voice_name: string
  voice_id: string
  audio_url: string
}

interface Step2Props {
  onContinue: (voice: Voice, text: string, audioUrl: string) => void
  selectedVoice: Voice | null
  text: string
}

export function Step2VoiceText({ onContinue, selectedVoice: initialVoice, text: initialText }: Step2Props) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(initialVoice)
  const [text, setText] = useState(initialText)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<string>('')
  const [estimatedCredits, setEstimatedCredits] = useState(0)

  useEffect(() => {
    fetchVoices()
  }, [])

  useEffect(() => {
    const length = text.length
    const credits = Math.ceil(length / 100) * 10
    setEstimatedCredits(credits)
  }, [text])

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/voices')
      const data = await res.json()
      setVoices(data.filter((v: Voice) => v.status === 'active'))
    } catch (error) {
      console.error('[v0] Failed to fetch voices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!selectedVoice || !text.trim()) return

    setGenerating(true)
    try {
      const res = await fetch('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoice.voice_id,
          text: text.trim(),
        }),
      })

      const data = await res.json()
      if (data.audioUrl) {
        setPreviewAudio(data.audioUrl)
      }
    } catch (error) {
      console.error('[v0] Failed to generate preview:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleContinue = () => {
    if (selectedVoice && text.trim() && previewAudio) {
      onContinue(selectedVoice, text.trim(), previewAudio)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">选择声音并输入文本</h3>
        <p className="text-sm text-muted-foreground">选择克隆的声音，输入文案生成语音</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : voices.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[150px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">暂无可用声音</p>
              <Button variant="link" asChild className="mt-2">
                <a href="/wd/sy">前往克隆声音</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <Label>选择声音模型</Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {voices.map((voice) => (
                <Card
                  key={voice.id}
                  className={`cursor-pointer transition-all ${
                    selectedVoice?.id === voice.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedVoice(voice)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{voice.voice_name}</p>
                      <audio src={voice.audio_url} controls className="mt-2 h-8 w-full" />
                    </div>
                    {selectedVoice?.id === voice.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="text">输入文案内容</Label>
            <Textarea
              id="text"
              placeholder="请输入要合成的文案内容..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{text.length} 字</span>
              <span>预计消耗 {estimatedCredits} 积分</span>
            </div>
          </div>

          {previewAudio && (
            <Card>
              <CardContent className="p-4">
                <Label>语音预览</Label>
                <audio src={previewAudio} controls className="mt-2 w-full" />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handlePreview}
              disabled={!selectedVoice || !text.trim() || generating}
              variant="outline"
              className="flex-1"
            >
              {generating ? (
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
            <Button
              onClick={handleContinue}
              disabled={!previewAudio}
              className="flex-1"
            >
              继续下一步
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
