'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from './audio-player'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'

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

interface VoiceListProps {
  voices: Voice[]
  onDelete: (id: string) => void
}

export function VoiceList({ voices, onDelete }: VoiceListProps) {
  if (voices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          还没有克隆的声音，点击上方按钮创建您的第一个声音模型
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {voices.map((voice) => (
        <Card key={voice.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{voice.voice_name}</CardTitle>
                <Badge variant={voice.status === 'active' ? 'default' : 'secondary'}>
                  {voice.status === 'active' ? '可用' : '不可用'}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(voice.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AudioPlayer audioUrl={voice.audio_url} />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>使用次数：{voice.usage_count}</span>
              <span>创建于 {format(new Date(voice.created_at), 'yyyy-MM-dd')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
