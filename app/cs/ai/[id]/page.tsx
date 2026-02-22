'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, MoreVertical, Trash2, Volume2, Loader2, Music, Edit2 } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

interface ClonedVoice {
  id: string
  voice_id: string
  voice_name: string
  created_at: string
}

interface SynthesizedAudio {
  id: string
  audio_url: string
  text: string
  created_at: string
}

export default function VoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const voiceId = params.id as string
  const { toast } = useToast()

  const [voice, setVoice] = useState<ClonedVoice | null>(null)
  const [audios, setAudios] = useState<SynthesizedAudio[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [audioMenuOpen, setAudioMenuOpen] = useState<string | null>(null)
  const [showRenameAudioDialog, setShowRenameAudioDialog] = useState(false)
  const [renamingAudio, setRenamingAudio] = useState<SynthesizedAudio | null>(null)
  const [newAudioName, setNewAudioName] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [customGroupId, setCustomGroupId] = useState('')

  useEffect(() => {
    loadVoiceData()
    loadAudios()
  }, [voiceId])

  const loadVoiceData = () => {
    try {
      const savedVoices = JSON.parse(localStorage.getItem('cloned_voices') || '[]')
      const voice = savedVoices.find((v: ClonedVoice) => v.id === voiceId)
      if (voice) {
        setVoice(voice)
      }
    } catch (error) {
      console.error('Failed to load voice:', error)
      toast({ title: '错误', description: '加载声音失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadAudios = () => {
    try {
      const savedAudios = JSON.parse(
        localStorage.getItem(`audios_${voiceId}`) || '[]'
      )
      setAudios(savedAudios)
    } catch (error) {
      console.error('Failed to load audios:', error)
    }
  }

  const handleDelete = () => {
    if (!confirm('确定要删除这个声音吗？删除后无法恢复。')) return

    try {
      const savedVoices = JSON.parse(localStorage.getItem('cloned_voices') || '[]')
      const updatedVoices = savedVoices.filter((v: ClonedVoice) => v.id !== voiceId)
      localStorage.setItem('cloned_voices', JSON.stringify(updatedVoices))
      localStorage.removeItem(`audios_${voiceId}`)
      router.push('/cs/ai')
    } catch (error) {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    }
  }

  const handleSynthesize = async () => {
    if (!inputText.trim()) {
      toast({ title: '错误', description: '请输入要合成的文案', variant: 'destructive' })
      return
    }

    if (!voice) return

    setIsSynthesizing(true)

    try {
      const requestBody: any = {
        text: inputText.trim(),
        voice_id: voice.voice_id,
        model: 'speech-2.8-hd',
      }

      if (customApiKey) {
        requestBody.api_key = customApiKey
      }
      if (customGroupId) {
        requestBody.group_id = customGroupId
      }

      const response = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`合成失败: ${response.statusText}`)
      }

      const contentType = response.headers.get('Content-Type') || ''
      let audioUrl: string = ''

      if (contentType.includes('audio/')) {
        const blob = await response.blob()
        audioUrl = URL.createObjectURL(blob)
      } else {
        const data = await response.json()
        if (data.data?.audioUrl) {
          audioUrl = data.data.audioUrl
        } else if (data.audioUrl) {
          audioUrl = data.audioUrl
        } else {
          throw new Error('未能获取音频')
        }
      }

      // 保存合成的音频
      const newAudio: SynthesizedAudio = {
        id: `audio_${Date.now()}`,
        audio_url: audioUrl,
        text: inputText.trim(),
        created_at: new Date().toISOString(),
      }

      const updatedAudios = [...audios, newAudio]
      setAudios(updatedAudios)
      localStorage.setItem(`audios_${voiceId}`, JSON.stringify(updatedAudios))

      setInputText('')
      setShowTextDialog(false)
      toast({ title: '成功', description: '语音合成成功！' })
    } catch (error) {
      console.error('Synthesis error:', error)
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '合成失败',
        variant: 'destructive',
      })
    } finally {
      setIsSynthesizing(false)
    }
  }

  const handleRenameVoice = () => {
    if (!newVoiceName.trim()) {
      toast({ title: '错误', description: '请输入声音名称', variant: 'destructive' })
      return
    }

    try {
      const savedVoices = JSON.parse(localStorage.getItem('cloned_voices') || '[]')
      const updatedVoices = savedVoices.map((v: ClonedVoice) =>
        v.id === voiceId ? { ...v, voice_name: newVoiceName } : v
      )
      localStorage.setItem('cloned_voices', JSON.stringify(updatedVoices))
      setVoice((prev) => prev ? { ...prev, voice_name: newVoiceName } : null)
      setShowRenameDialog(false)
      toast({ title: '成功', description: '声音名称已更新' })
    } catch (error) {
      toast({ title: '错误', description: '重命名失败', variant: 'destructive' })
    }
  }

  const handleRenameAudio = () => {
    if (!renamingAudio || !newAudioName.trim()) {
      toast({ title: '错误', description: '请输入新名称', variant: 'destructive' })
      return
    }

    try {
      const updatedAudios = audios.map((a) =>
        a.id === renamingAudio.id ? { ...a, text: newAudioName } : a
      )
      setAudios(updatedAudios)
      localStorage.setItem(`audios_${voiceId}`, JSON.stringify(updatedAudios))
      setShowRenameAudioDialog(false)
      setRenamingAudio(null)
      toast({ title: '成功', description: '音频文案已更新' })
    } catch (error) {
      toast({ title: '错误', description: '重命名失败', variant: 'destructive' })
    }
  }

  const handleDeleteAudio = (audioId: string) => {
    if (!confirm('确定要删除这条合成音频吗？')) return

    try {
      const updatedAudios = audios.filter((a) => a.id !== audioId)
      setAudios(updatedAudios)
      localStorage.setItem(`audios_${voiceId}`, JSON.stringify(updatedAudios))
      toast({ title: '成功', description: '音频已删除' })
    } catch (error) {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!voice) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium mb-2">声音不存在</p>
          <Button onClick={() => router.push('/cs/ai')}>返回</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/cs/ai')}
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
                    handleDelete()
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
          {isSynthesizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              合成中...
            </>
          ) : (
            <>
              <Music className="mr-2 h-4 w-4" />
              输入文案合成声音
            </>
          )}
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
                          {audio.audio_url && (
                            <audio controls className="w-full mb-3">
                              <source src={audio.audio_url} type="audio/mpeg" />
                              您的浏览器不支持音频播放
                            </audio>
                          )}
                          <p className="text-sm">{audio.text || '无文案'}</p>
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
                                  setRenamingAudio(audio)
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
                                  handleDeleteAudio(audio.id)
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
                disabled={isSynthesizing}
              />
              <p className="text-xs text-muted-foreground">
                使用声音: {voice?.voice_name}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTextDialog(false)}
                disabled={isSynthesizing}
              >
                取消
              </Button>
              <Button onClick={handleSynthesize} disabled={isSynthesizing}>
                {isSynthesizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    合成中...
                  </>
                ) : (
                  '开始合成语音'
                )}
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
              <Button onClick={handleRenameVoice}>确定</Button>
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
              <Button onClick={handleRenameAudio}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
