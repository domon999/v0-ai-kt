'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Step4Props {
  videoId: string
  voiceId: string
  text: string
  backgroundId: string
  videoUrl: string
  voiceName: string
  backgroundUrl: string
}

export function Step4Synthesis({
  videoId,
  voiceId,
  text,
  backgroundId,
  videoUrl,
  voiceName,
  backgroundUrl,
}: Step4Props) {
  const router = useRouter()
  const [synthesizing, setSynthesizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  const estimatedCredits = 50 + Math.ceil(text.length / 100) * 10

  const handleSynthesize = async () => {
    setSynthesizing(true)
    setProgress(0)
    setError(null)

    try {
      setCurrentStep('生成语音中...')
      setProgress(20)

      const ttsRes = await fetch('/api/minimax/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voiceId, text }),
      })

      if (!ttsRes.ok) throw new Error('语音生成失败')

      const { audio_url } = await ttsRes.json()
      setProgress(40)

      setCurrentStep('唇同步处理中...')
      const syncRes = await fetch('/api/dreamface/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          audio_url,
        }),
      })

      if (!syncRes.ok) throw new Error('唇同步失败')

      const { task_id, sync_task_id } = await syncRes.json()
      setProgress(60)

      setCurrentStep('等待处理完成...')
      let completed = false
      let finalVideoUrl = ''

      while (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const queryRes = await fetch(`/api/dreamface/query-task?task_id=${task_id}`)
        if (!queryRes.ok) throw new Error('查询任务失败')

        const queryData = await queryRes.json()

        if (queryData.status === 'completed') {
          completed = true
          finalVideoUrl = queryData.video_url
          setProgress(100)
        } else if (queryData.status === 'failed') {
          throw new Error('合成失败')
        } else {
          setProgress((prev) => Math.min(prev + 5, 95))
        }
      }

      setCurrentStep('保存作品中...')
      const workRes = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `口播作品 - ${new Date().toLocaleString('zh-CN')}`,
          video_id: videoId,
          voice_id: voiceId,
          sync_task_id,
          final_video_url: finalVideoUrl,
          total_credits_used: estimatedCredits,
        }),
      })

      if (!workRes.ok) throw new Error('保存作品失败')

      toast.success('口播作品合成成功！')
      router.push('/wd/zp')
    } catch (err: any) {
      setError(err.message || '合成失败，请稍后重试')
      toast.error(err.message || '合成失败')
    } finally {
      setSynthesizing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>预览和确认</CardTitle>
          <p className="text-sm text-muted-foreground">确认所有素材无误后开始合成</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">数字人视频</h3>
              <video src={videoUrl} controls className="w-full rounded-lg" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">背景图片</h3>
              <img src={backgroundUrl} alt="背景" className="w-full rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">声音和文案</h3>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">声音模型</Badge>
                <span className="text-sm">{voiceName}</span>
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">预计消耗积分</span>
              <span className="text-lg font-bold">{estimatedCredits}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              唇同步 50 积分 + TTS {Math.ceil(text.length / 100) * 10} 积分
            </p>
          </div>

          {synthesizing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSynthesize}
            disabled={synthesizing}
            size="lg"
            className="w-full gap-2"
          >
            {synthesizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                合成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始合成
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
