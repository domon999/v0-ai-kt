'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Trash2, Mic } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
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

interface Voice {
  id: string
  name: string
  audio_url: string
  status: string
  created_at: string
}

interface VoiceCardProps {
  voice: Voice
  onDelete?: (id: string) => void
}

export function VoiceCard({ voice, onDelete }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handlePlayPause = () => {
    if (!audio) {
      const newAudio = new Audio(voice.audio_url)
      newAudio.addEventListener('ended', () => setIsPlaying(false))
      newAudio.play()
      setAudio(newAudio)
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/voices/${voice.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ description: '声音删除成功' })
        onDelete?.(voice.id)
      } else {
        const data = await response.json()
        toast({ 
          description: data.error || '删除失败', 
          variant: 'destructive' 
        })
      }
    } catch (error) {
      console.error('[v0] Delete voice error:', error)
      toast({ description: '删除失败，请重试', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{voice.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(voice.created_at), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-2 w-2 rounded-full ${
                  voice.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {voice.status === 'completed' ? '已完成' : '处理中'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2 border-t bg-muted/50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={voice.status !== 'completed'}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                试听
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除声音 "{voice.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
