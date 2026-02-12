'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Download, Trash2, Share2 } from 'lucide-react'
import { WorkDetailDialog } from './work-detail-dialog'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface WorkCardProps {
  work: {
    id: string
    title: string
    final_video_url: string
    total_credits_used: number
    created_at: string
  }
  onDelete: (id: string) => void
}

export function WorkCard({ work, onDelete }: WorkCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('确定要删除这个作品吗？')) return
    
    setDeleting(true)
    try {
      await onDelete(work.id)
    } catch (error) {
      alert('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = work.final_video_url
    a.download = `${work.title}.mp4`
    a.click()
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-muted">
            <video
              src={work.final_video_url}
              className="w-full h-full object-cover"
              poster={work.final_video_url + '#t=0.1'}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowDetail(true)}
                className="rounded-full"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold truncate">{work.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(work.created_at), { 
                  addSuffix: true,
                  locale: zhCN 
                })}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>消耗积分: {work.total_credits_used}</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <WorkDetailDialog
        work={work}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </>
  )
}
