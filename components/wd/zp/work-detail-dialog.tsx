'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface WorkDetailDialogProps {
  work: {
    id: string
    title: string
    final_video_url: string
    total_credits_used: number
    created_at: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkDetailDialog({ work, open, onOpenChange }: WorkDetailDialogProps) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = work.final_video_url
    a.download = `${work.title}.mp4`
    a.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: work.title,
          url: work.final_video_url,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(work.final_video_url)
      alert('视频链接已复制到剪贴板')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{work.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <video
            src={work.final_video_url}
            controls
            autoPlay
            className="w-full rounded-lg bg-black"
          />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间：</span>
              <span>{format(new Date(work.created_at), 'PPP', { locale: zhCN })}</span>
            </div>
            <div>
              <span className="text-muted-foreground">消耗积分：</span>
              <span>{work.total_credits_used}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              下载视频
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
