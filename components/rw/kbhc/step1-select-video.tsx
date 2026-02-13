'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Check } from 'lucide-react'

interface Video {
  id: string
  video_url: string
  created_at: string
  status: string
}

interface Step1Props {
  videos: Video[]
  selectedVideoId: string | null
  onSelectVideo: (id: string) => void
}

export function Step1SelectVideo({ videos, selectedVideoId, onSelectVideo }: Step1Props) {
  const completedVideos = videos.filter((v) => v.status === 'completed')

  if (completedVideos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>选择数字人视频</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              暂无可用的数字人视频，请先在克隆页面生成视频
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择数字人视频</CardTitle>
        <p className="text-sm text-muted-foreground">
          从您的数字人视频中选择一个用于合成口播作品
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {completedVideos.map((video) => (
            <div
              key={video.id}
              className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                selectedVideoId === video.id
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectVideo(video.id)}
            >
              {selectedVideoId === video.id && (
                <div className="absolute right-2 top-2 z-10">
                  <Badge className="gap-1">
                    <Check className="h-3 w-3" />
                    已选择
                  </Badge>
                </div>
              )}
              <video
                src={video.video_url}
                className="aspect-video w-full object-cover"
                muted
                loop
                playsInline
              />
              <div className="p-3">
                <p className="text-xs text-muted-foreground">
                  {new Date(video.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
