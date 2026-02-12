'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Video, Mic, Image as ImageIcon, Sparkles } from 'lucide-react'

interface SynthesisData {
  video: any
  voice: any
  text: string
  audioUrl: string
  background: any
}

interface Step4Props {
  data: SynthesisData
  onComplete: (workId: string) => void
}

export function Step4Synthesis({ data, onComplete }: Step4Props) {
  const [title, setTitle] = useState('')
  const [synthesizing, setSynthesizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入作品标题')
      return
    }

    setSynthesizing(true)
    setProgress(10)
    setCurrentStep('准备素材...')

    try {
      // Step 1: Upload audio to storage
      setProgress(20)
      setCurrentStep('上传语音文件...')
      const audioBlob = await fetch(data.audioUrl).then((r) => r.blob())
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' })
      
      const formData = new FormData()
      formData.append('file', audioFile)
      
      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })
      const { url: audioStorageUrl } = await uploadRes.json()

      // Step 2: Call DreamFace API for lip sync
      setProgress(40)
      setCurrentStep('进行唇同步处理...')
      const syncRes = await fetch('/api/dreamface/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: data.video.extended_video_url || data.video.video_url,
          audioUrl: audioStorageUrl,
        }),
      })
      const { taskId, syncTaskId } = await syncRes.json()

      // Step 3: Poll for completion
      setProgress(60)
      setCurrentStep('等待处理完成...')
      let finalVideoUrl = ''
      let attempts = 0
      const maxAttempts = 60

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        
        const statusRes = await fetch(`/api/dreamface/query-task?taskId=${taskId}`)
        const statusData = await statusRes.json()

        if (statusData.status === 'completed' && statusData.videoUrl) {
          finalVideoUrl = statusData.videoUrl
          break
        } else if (statusData.status === 'failed') {
          throw new Error('唇同步处理失败')
        }

        attempts++
        setProgress(60 + (attempts / maxAttempts) * 30)
      }

      if (!finalVideoUrl) {
        throw new Error('处理超时，请稍后重试')
      }

      // Step 4: Create work record
      setProgress(95)
      setCurrentStep('保存作品...')
      const workRes = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          videoId: data.video.id,
          voiceId: data.voice.id,
          syncTaskId,
          finalVideoUrl,
          totalCreditsUsed: 250, // 200 (video) + 50 (sync) + TTS credits
        }),
      })
      const work = await workRes.json()

      setProgress(100)
      setCurrentStep('完成！')
      
      setTimeout(() => {
        onComplete(work.id)
      }, 1000)

    } catch (error) {
      console.error('[v0] Synthesis failed:', error)
      alert('合成失败：' + (error as Error).message)
      setSynthesizing(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const totalCredits = 200 + 50 + Math.ceil(data.text.length / 100) * 10

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">预览与提交</h3>
        <p className="text-sm text-muted-foreground">确认信息并开始合成</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              数字人视频
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={data.video.extended_video_url || data.video.video_url}
              controls
              className="w-full rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              克隆声音
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium">{data.voice.voice_name}</p>
            <audio src={data.audioUrl} controls className="w-full" />
            <p className="text-xs text-muted-foreground line-clamp-3">{data.text}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              背景图片
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={data.background.image_url}
              alt={data.background.name}
              className="w-full rounded-md"
            />
            <p className="mt-2 text-xs text-muted-foreground">{data.background.name}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">作品标题</Label>
            <Input
              id="title"
              placeholder="输入作品标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={synthesizing}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <span className="text-sm font-medium">预计消耗积分</span>
            <span className="text-lg font-bold text-primary">{totalCredits}</span>
          </div>

          {synthesizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={synthesizing || !title.trim()}
            className="w-full"
            size="lg"
          >
            {synthesizing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                合成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                开始合成
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
