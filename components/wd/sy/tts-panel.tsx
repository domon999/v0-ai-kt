'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

// MiniMax 官方预设声音（根据官方文档）
const OFFICIAL_VOICES = [
  { id: 'male-qn-qingse', name: '青涩青年音色' },
  { id: 'male-qn-jingying', name: '精英青年音色' },
  { id: 'male-qn-badao', name: '霸道青年音色' },
  { id: 'male-qn-daxuesheng', name: '青年大学生音色' },
  { id: 'female-shaonv', name: '少女音色' },
  { id: 'female-yujie', name: '御姐音色' },
  { id: 'female-chengshu', name: '成熟女性音色' },
  { id: 'female-tianmei', name: '甜美女性音色' },
]

export function TTSPanel({ voices }: TTSPanelProps) {
  const [text, setText] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [customGroupId, setCustomGroupId] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const estimatedCredits = Math.ceil(text.length / 10) // 每10个字符消耗1积分

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
    // 释放之前的音频 URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl('')
    }

    try {
      const usingCustomKey = !!customApiKey
      console.log('[v0] Starting TTS generation:', {
        textLength: text.length,
        voiceId: selectedVoiceId,
        usingCustomKey,
      })

      const requestBody: any = {
        text: text.trim(),
        voice_id: selectedVoiceId,
        model: 'speech-2.8-hd',
        speed: 1,
        vol: 10,
        pitch: 1,
      }

      // 如果提供了自定义 API Key，添加到请求中
      if (customApiKey) {
        requestBody.api_key = customApiKey
      }
      if (customGroupId) {
        requestBody.group_id = customGroupId
      }

      const response = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('[v0] Response status:', response.status)

      if (!response.ok) {
        // 尝试解析 JSON 错误信息
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const errorData = await response.json()
          console.error('[v0] API error:', errorData)
          throw new Error(errorData.error || errorData.message || '生成失败')
        }
        throw new Error(`生成失败 (HTTP ${response.status})`)
      }

      // API 直接返回音频流（audio/mpeg）
      const audioBlob = await response.blob()
      console.log('[v0] Audio blob size:', audioBlob.size, 'bytes')
      
      if (audioBlob.size === 0) {
        throw new Error('返回的音频数据为空')
      }

      // 验证音频格式
      if (!audioBlob.type.includes('audio')) {
        console.warn('[v0] Unexpected blob type:', audioBlob.type)
      }

      // 创建可播放的 Object URL
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      console.log('[v0] Audio URL created successfully')
      
      toast({
        title: '成功',
        description: `语音生成成功！(${Math.round(audioBlob.size / 1024)} KB)`,
      })
    } catch (error) {
      console.error('[v0] TTS generation error:', error)
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
        {/* API 配置区域 */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">API 配置（可选）</Label>
            {(customApiKey || customGroupId) && (
              <Badge variant="secondary" className="text-xs">使用自定义配置</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            留空则使用 /glht/api 中配置的 MiniMax API Key
          </p>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-xs">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="留空使用配置的 API Key"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-id" className="text-xs">Group ID（可选）</Label>
              <Input
                id="group-id"
                placeholder="留空使用配置的 Group ID"
                value={customGroupId}
                onChange={(e) => setCustomGroupId(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          {(customApiKey || customGroupId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomApiKey('')
                setCustomGroupId('')
              }}
              className="w-full h-8 text-xs"
            >
              清除自定义配置
            </Button>
          )}
        </div>

        <div>
          <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
            <SelectTrigger>
              <SelectValue placeholder="选择声音模型" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>官方声音</SelectLabel>
                {OFFICIAL_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              
              {voices.length > 0 && (
                <SelectGroup>
                  <SelectLabel>我的声音</SelectLabel>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.voice_id}>
                      {voice.voice_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
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
