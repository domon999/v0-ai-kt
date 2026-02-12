'use client'

import { VideoCard } from './video-card'
import { Video } from 'lucide-react'

interface Video {
  id: string
  video_url: string
  extended_video_url?: string
  status: string
  duration: number
  created_at: string
}

interface VideoListProps {
  videos: Video[]
  onExtend: (videoId: string) => Promise<void>
  onDelete: (videoId: string) => Promise<void>
  onRefresh: () => void
}

export function VideoList({ videos, onExtend, onDelete, onRefresh }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">暂无视频</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          使用上方的克隆功能创建您的第一个数字人视频
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">我的视频</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onExtend={onExtend}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}
