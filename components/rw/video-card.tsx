'use client'

import { useState } from 'react'
import { Play, MoreVertical, Trash2, Edit, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface VideoCardProps {
  video: {
    id: string
    video_url: string
    extended_video_url?: string
    status: string
    duration: number
    created_at: string
  }
  onExtend?: (videoId: string) => void
  onDelete?: (videoId: string) => void
  onRefresh?: () => void
}

export function VideoCard({ video, onExtend, onDelete, onRefresh }: VideoCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [extending, setExtending] = useState(false)

  const handleExtend = async () => {
    if (!onExtend) return
    setExtending(true)
    try {
      await onExtend(video.id)
      onRefresh?.()
    } catch (error) {
      console.error('Extend error:', error)
    } finally {
      setExtending(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    await onDelete(video.id)
    setShowDeleteDialog(false)
    onRefresh?.()
  }

  const videoUrl = video.extended_video_url || video.video_url

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-muted">
            {video.status === 'completed' && videoUrl ? (
              <video
                src={videoUrl}
                className="h-full w-full object-cover"
                controls
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {video.status === 'processing' ? '生成中...' : '等待处理'}
                </p>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{video.duration}秒</span>
                {video.extended_video_url && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    已延长
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!video.extended_video_url && video.status === 'completed' && (
                    <DropdownMenuItem onClick={handleExtend} disabled={extending}>
                      <Clock className="mr-2 h-4 w-4" />
                      {extending ? '延长中...' : '延长至32秒 (200积分)'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(video.created_at), {
                addSuffix: true,
                locale: zhCN,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，确定要删除这个视频吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
