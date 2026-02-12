'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { VoiceList } from '@/components/wd/sy/voice-list'
import { CloneVoiceDialog } from '@/components/wd/sy/clone-voice-dialog'
import { TTSPanel } from '@/components/wd/sy/tts-panel'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Voice {
  id: string
  voice_name: string
  voice_id: string
  audio_url: string
  status: string
  credits_used: number
  usage_count: number
  created_at: string
}

interface VoicePageClientProps {
  initialVoices: Voice[]
}

export function VoicePageClient({ initialVoices }: VoicePageClientProps) {
  const [voices, setVoices] = useState<Voice[]>(initialVoices)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const { toast } = useToast()

  const refreshVoices = async () => {
    const response = await fetch('/api/voices')
    if (response.ok) {
      const data = await response.json()
      setVoices(data.voices)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个声音模型吗？')) return

    try {
      const response = await fetch(`/api/voices/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('删除失败')

      toast({ title: '成功', description: '声音模型已删除' })
      setVoices(voices.filter((v) => v.id !== id))
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">声音管理</h1>
          <p className="text-muted-foreground">
            克隆您的声音，使用 TTS 生成语音
          </p>
        </div>
        <Button onClick={() => setIsCloneDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          克隆声音
        </Button>
      </div>

      <Separator />

      <VoiceList voices={voices} onDelete={handleDelete} />

      <Separator />

      <TTSPanel voices={voices} />

      <CloneVoiceDialog
        open={isCloneDialogOpen}
        onOpenChange={setIsCloneDialogOpen}
        onSuccess={refreshVoices}
      />
    </div>
  )
}
