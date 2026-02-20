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
  const [asyncTaskId, setAsyncTaskId] = useState('')
  const [asyncStatus, setAsyncStatus] = useState('')
  const [asyncFileId, setAsyncFileId] = useState('')
  const [isAsyncLoading, setIsAsyncLoading] = useState(false)
  const { toast } = useToast()

  const estimatedCredits = Math.ceil(text.length / 10) // 每10个字符消耗1积分

  // 异步生成：步骤1 - 创建任务
  const handleAsyncCreate = async () => {
    if (!text.trim()) {
      toast({ title: '错误', description: '请输入要转换的文本', variant: 'destructive' })
      return
    }

    if (!selectedVoiceId) {
      toast({ title: '错误', description: '请选择声音模型', variant: 'destructive' })
      return
    }

    setIsAsyncLoading(true)
    setAsyncTaskId('')
    setAsyncStatus('')
    setAsyncFileId('')
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl('')
    }

    try {
      const requestBody: any = {
        model: 'speech-2.8-hd',
        text: text.trim(),
        voice_id: selectedVoiceId,
        speed: 1,
        vol: 10,
        pitch: 1,
      }

      if (customApiKey) {
        requestBody.api_key = customApiKey
      }
      if (customGroupId) {
        requestBody.group_id = customGroupId
      }

      const response = await fetch('/api/minimax/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success && data.data?.taskId) {
        setAsyncTaskId(data.data.taskId)
        setAsyncStatus('创建成功')
        toast({
          title: '任务创建成功',
          description: `任务ID: ${data.data.taskId.slice(0, 16)}...`,
        })
      } else {
        throw new Error(data.error || '创建任务失败')
      }
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsAsyncLoading(false)
    }
  }

  // 异步生成：步骤2 - 查询状态
  const handleAsyncQuery = async () => {
    if (!asyncTaskId) {
      toast({ title: '错误', description: '请先创建任务', variant: 'destructive' })
      return
    }

    setIsAsyncLoading(true)

    try {
      const response = await fetch(`/api/minimax/async?task_id=${asyncTaskId}`)
      const data = await response.json()

      if (data.success) {
        const status = data.data?.status || 'unknown'
        setAsyncStatus(status)

        if (data.data?.file_id) {
          setAsyncFileId(data.data.file_id)
          toast({
            title: '任务完成',
            description: '可以下载音频了',
          })
        } else {
          toast({
            title: '任务状态',
            description: `当前状态: ${status}`,
          })
        }
      } else {
        throw new Error(data.error || '查询失败')
      }
    } catch (error) {
      toast({
        title: '查询失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsAsyncLoading(false)
    }
  }

  // 异步生成：步骤3 - 下载音频
  const handleAsyncDownload = async () => {
    if (!asyncFileId) {
      toast({ title: '错误', description: '请先等待任务完成', variant: 'destructive' })
      return
    }

    setIsAsyncLoading(true)

    try {
      const response = await fetch(`/api/minimax/async/download?file_id=${asyncFileId}`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `下载失败: HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      
      toast({
        title: '下载成功',
        description: `音频大小: ${Math.round(blob.size / 1024)} KB`,
      })
    } catch (error) {
      toast({
        title: '下载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsAsyncLoading(false)
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

        {/* 异步生成流程 */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-semibold text-muted-foreground">异步生成流程</p>
          
          <div className="grid grid-cols-2 gap-2">
            {/* 步骤1: 创建任务 */}
            <Button
              onClick={handleAsyncCreate}
              disabled={isAsyncLoading || !text.trim() || !selectedVoiceId}
              variant="outline"
              className="w-full"
            >
              {isAsyncLoading && !asyncTaskId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              1. 创建任务
            </Button>

            {/* 步骤2: 查询状态 */}
            <Button
              onClick={handleAsyncQuery}
              disabled={isAsyncLoading || !asyncTaskId}
              variant="outline"
              className="w-full"
            >
              {isAsyncLoading && asyncTaskId && !asyncFileId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              2. 查询状态
            </Button>

            {/* 步骤3: 下载音频 */}
            <Button
              onClick={handleAsyncDownload}
              disabled={isAsyncLoading || !asyncFileId}
              variant="outline"
              className="w-full"
            >
              {isAsyncLoading && asyncFileId && !audioUrl ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              3. 下载音频
            </Button>

            {/* 步骤4: 播放音频 */}
            <Button
              disabled={!audioUrl}
              variant="outline"
              className="w-full"
              onClick={() => {
                const audio = document.querySelector('audio')
                if (audio) audio.play()
              }}
            >
              4. 播放音频
            </Button>
          </div>

          {/* 状态显示 */}
          {(asyncTaskId || asyncStatus || asyncFileId) && (
            <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              {asyncTaskId && (
                <p>任务ID: {asyncTaskId.slice(0, 24)}...</p>
              )}
              {asyncStatus && (
                <p>状态: {asyncStatus}</p>
              )}
              {asyncFileId && (
                <p>文件ID: {asyncFileId.slice(0, 24)}...</p>
              )}
            </div>
          )}
        </div>

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
