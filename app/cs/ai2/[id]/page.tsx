'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, MoreVertical, Trash2, Volume2, Music, Edit2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SynthesizedAudio {
  id: string
  audio_url: string
  text: string
  created_at: string
}

export default function VoiceDetailUIPage() {
  const router = useRouter()
  const params = useParams()
  const voiceId = params.id as string

  const [showMenu, setShowMenu] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [audioMenuOpen, setAudioMenuOpen] = useState<string | null>(null)
  const [showRenameAudioDialog, setShowRenameAudioDialog] = useState(false)
  const [newAudioName, setNewAudioName] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [customGroupId, setCustomGroupId] = useState('')

  // Mock data
  const voice = {
    id: voiceId,
    voice_id: 'my-voice-001',
    voice_name: '张三的声音',
    created_at: '2026-02-20T10:00:00Z',
  }

  const [audios] = useState<SynthesizedAudio[]>([
    {
      id: 'audio-1',
      audio_url: '',
      text: '大兄弟，听您口音不是本地人吧，头回来天津卫。',
      created_at: '2026-02-22T10:30:00Z',
    },
    {
      id: 'audio-2',
      audio_url: '',
      text: '后来认为啊，是有人抓这鸡，可是抓鸡的地方呢没人听过鸡叫。',
      created_at: '2026-02-22T11:15:00Z',
    },
    {
      id: 'audio-3',
      audio_url: '',
      text: '这是第三条测试语音，用于展示UI效果。',
      created_at: '2026-02-22T12:00:00Z',
    },
  ])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/cs/ai2')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{voice.voice_name}</h1>
              <p className="text-muted-foreground text-sm">
                声音 ID: {voice.voice_id}
              </p>
            </div>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    setShowMenu(false)
                    setNewVoiceName(voice.voice_name)
                    setShowRenameDialog(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  重命名
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm text-destructive hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    setShowMenu(false)
                    alert('删除功能（UI 演示）')
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  删除声音
                </button>
              </div>
            )}
          </div>
        </div>

        {/* API 配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API 配置（可选）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="留空使用配置的 API Key"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group ID（可选）</label>
                <Input
                  placeholder="留空使用配置的 Group ID"
                  value={customGroupId}
                  onChange={(e) => setCustomGroupId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Audio Button */}
        <Button
          onClick={() => setShowTextDialog(true)}
          size="lg"
          className="w-full"
        >
          <Music className="mr-2 h-4 w-4" />
          输入文案合成声音
        </Button>

        {/* Synthesized Audios List */}
        <div>
          <h2 className="text-xl font-bold mb-4">合成声音列表</h2>
          {audios.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">还没有合成声音</p>
                <p className="text-muted-foreground">点击上方按钮开始合成</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {audios.map((audio) => (
                <Card key={audio.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-3 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground text-center">
                              音频播放器（UI 演示）
                            </p>
                          </div>
                          <p className="text-sm">{audio.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(audio.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setAudioMenuOpen(
                                audioMenuOpen === audio.id ? null : audio.id
                              )
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {audioMenuOpen === audio.id && (
                            <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  setNewAudioName(audio.text)
                                  setShowRenameAudioDialog(true)
                                  setAudioMenuOpen(null)
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                                重命名
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  alert('删除功能（UI 演示）')
                                  setAudioMenuOpen(null)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Text Input Dialog */}
        <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>输入文案合成声音</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="请输入要转换为语音的文案..."
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                使用声音: {voice.voice_name}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTextDialog(false)}
              >
                取消
              </Button>
              <Button onClick={() => {
                alert('合成功能（UI 演示）')
                setShowTextDialog(false)
              }}>
                开始合成语音
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Voice Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重命名声音</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newVoiceName}
                onChange={(e) => setNewVoiceName(e.target.value)}
                placeholder="输入新的声音名称"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
              >
                取消
              </Button>
              <Button onClick={() => {
                alert('重命名功能（UI 演示）')
                setShowRenameDialog(false)
              }}>
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Audio Dialog */}
        <Dialog open={showRenameAudioDialog} onOpenChange={setShowRenameAudioDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重命名音频</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newAudioName}
                onChange={(e) => setNewAudioName(e.target.value)}
                placeholder="输入新的文案名称"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRenameAudioDialog(false)}
              >
                取消
              </Button>
              <Button onClick={() => {
                alert('重命名功能（UI 演示）')
                setShowRenameAudioDialog(false)
              }}>
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
