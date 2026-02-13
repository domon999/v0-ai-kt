'use client'

import { useState } from 'react'
import { UploadStep } from '@/components/rw/upload-step'
import { GenerateStep } from '@/components/rw/generate-step'
import { VideoStep } from '@/components/rw/video-step'
import { VideoList } from '@/components/rw/video-list'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import Link from 'next/link'

interface Video {
  id: string
  video_url: string
  extended_video_url?: string
  status: string
  duration: number
  created_at: string
}

interface ClonePageClientProps {
  initialVideos: Video[]
}

export function ClonePageClient({ initialVideos }: ClonePageClientProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [digitalHumanUrl, setDigitalHumanUrl] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl)
  }

  const handleGenerateComplete = (imageUrl: string) => {
    setDigitalHumanUrl(imageUrl)
  }

  const handleVideoComplete = () => {
    refreshVideos()
    // 重置流程，允许创建新视频
    setUploadedImageUrl(null)
    setDigitalHumanUrl(null)
  }

  const handleExtendVideo = async (videoId: string) => {
    const response = await fetch('/api/railway/extend-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    })

    if (!response.ok) {
      throw new Error('Failed to extend video')
    }

    refreshVideos()
  }

  const handleDeleteVideo = async (videoId: string) => {
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete video')
    }

    refreshVideos()
  }

  const refreshVideos = async () => {
    const response = await fetch('/api/videos')
    if (response.ok) {
      const data = await response.json()
      setVideos(data.videos)
      setRefreshKey((prev) => prev + 1)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">数字人克隆</h1>
          <p className="mt-2 text-muted-foreground">
            3步创建专属数字人视频：上传照片 → 生成数字人 → 转换视频
          </p>
        </div>
        <Link href="/rw/kbhc">
          <Button size="lg" className="gap-2">
            <Video className="h-5 w-5" />
            口播合成
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UploadStep onUploadComplete={handleUploadComplete} />

        {uploadedImageUrl && (
          <GenerateStep
            imageUrl={uploadedImageUrl}
            onGenerateComplete={handleGenerateComplete}
          />
        )}

        {digitalHumanUrl && (
          <VideoStep
            digitalHumanUrl={digitalHumanUrl}
            onVideoComplete={handleVideoComplete}
          />
        )}
      </div>

      <Separator />

      <VideoList
        key={refreshKey}
        videos={videos}
        onExtend={handleExtendVideo}
        onDelete={handleDeleteVideo}
        onRefresh={refreshVideos}
      />
    </div>
  )
}
