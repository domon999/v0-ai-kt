'use client'

import { useState, useEffect } from 'react'
import { Video, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface VideoStepProps {
  digitalHumanUrl: string
  onVideoComplete: (videoUrl: string, videoId: string) => void
}

export function VideoStep({ digitalHumanUrl, onVideoComplete }: VideoStepProps) {
  const [generating, setGenerating] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)
    try {
      const response = await fetch('/api/railway/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: digitalHumanUrl }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Video generation failed')
      }

      const data = await response.json()
      setTaskId(data.taskId)
    } catch (error: any) {
      console.error('Video error:', error)
      alert(error.message || '生成视频失败')
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (!taskId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/railway/query-task?taskId=${taskId}`)
        const data = await response.json()

        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl)
          setProgress(100)
          setGenerating(false)
          onVideoComplete(data.videoUrl, data.videoId)
          clearInterval(pollInterval)
        } else if (data.status === 'failed') {
          throw new Error('Video generation failed')
        } else {
          setProgress((prev) => Math.min(prev + 5, 90))
        }
      } catch (error) {
        console.error('Poll error:', error)
        clearInterval(pollInterval)
        setGenerating(false)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [taskId])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <Video className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-2 text-lg font-semibold">生成视频</h3>
            <p className="text-sm text-muted-foreground">
              将数字人形象转换为 16 秒动态视频
            </p>
          </div>

          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg"
            />
          ) : (
            <div className="aspect-video flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              <img
                src={digitalHumanUrl}
                alt="Digital Human"
                className="h-full w-full object-cover rounded-lg opacity-50"
              />
            </div>
          )}

          {generating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-center text-sm text-muted-foreground">
                生成中... {progress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating || !!videoUrl}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : videoUrl ? (
              '已生成'
            ) : (
              '生成视频 (200 积分)'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
