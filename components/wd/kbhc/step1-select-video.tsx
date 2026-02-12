'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, PlayCircle } from 'lucide-react'

interface Video {
  id: string
  source_image_url: string
  video_url: string
  extended_video_url: string | null
  duration: number
  created_at: string
}

interface Step1Props {
  onSelect: (video: Video) => void
  selectedVideo: Video | null
}

export function Step1SelectVideo({ onSelect, selectedVideo }: Step1Props) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(data.filter((v: Video) => v.status === 'completed' && v.video_url))
    } catch (error) {
      console.error('[v0] Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">选择数字人视频</h3>
        <p className="text-sm text-muted-foreground">从您已生成的视频中选择一个</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">暂无可用视频</p>
              <Button variant="link" asChild className="mt-2">
                <a href="/rw">前往生成数字人视频</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              className={`cursor-pointer transition-all ${
                selectedVideo?.id === video.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(video)}
            >
              <CardContent className="p-2">
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <video
                    src={video.extended_video_url || video.video_url}
                    className="h-full w-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    {selectedVideo?.id === video.id ? (
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    ) : (
                      <PlayCircle className="h-10 w-10 text-white" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {video.duration || 16}秒视频
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
