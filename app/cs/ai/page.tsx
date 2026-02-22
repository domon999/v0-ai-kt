'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Music, Trash2, MoreVertical, Edit2, Loader2, Volume2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface ClonedVoice {
  id: string
  voice_id: string
  voice_name: string
  created_at: string
}

export default function VoiceClonePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [voices, setVoices] = useState<ClonedVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [cloneStep, setCloneStep] = useState(1)
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [clonePromptFile, setClonePromptFile] = useState<File | null>(null)
  const [clonePromptText, setClonePromptText] = useState('')
  const [cloneVoiceId, setCloneVoiceId] = useState('')
  const [cloneVoiceName, setCloneVoiceName] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)
  const [error, setError] = useState('')
  const [customApiKey, setCustomApiKey] = useState('')
  const [customGroupId, setCustomGroupId] = useState('')
  const [renameDialog, setRenameDialog] = useState(false)
  const [renamingVoice, setRenamingVoice] = useState<ClonedVoice | null>(null)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [voiceMenuOpen, setVoiceMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    setLoading(true)
    try {
      // 从 localStorage 或本地存储加载克隆的声音列表
      const savedVoices = JSON.parse(localStorage.getItem('cloned_voices') || '[]')
      setVoices(savedVoices)
    } catch (error) {
      console.error('Failed to load voices:', error)
      toast({ title: '错误', description: '加载声音列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCloneNext = async () => {
    if (cloneStep === 1) {
      if (!cloneFile) {
        setError('请选择待克隆音频')
        return
      }
      const fileSizeMB = cloneFile.size / 1024 / 1024
      if (fileSizeMB > 20) {
        setError('文件过大（最大20MB）')
        return
      }
      setCloneStep(2)
      setError('')
    } else if (cloneStep === 2) {
      if (!cloneVoiceId.trim()) {
        setError('请输入自定义 Voice ID')
        return
      }
      if (!cloneVoiceName.trim()) {
        setError('请输入声音名称')
        return
      }
      setCloneLoading(true)
      setError('')

      try {
        const formData = new FormData()
        formData.append('file', cloneFile)
        formData.append('voice_id', cloneVoiceId)
        formData.append('voice_name', cloneVoiceName)
        if (clonePromptFile) {
          formData.append('prompt_file', clonePromptFile)
          formData.append('prompt_text', clonePromptText)
        }
        if (customApiKey) {
          formData.append('api_key', customApiKey)
        }
        if (customGroupId) {
          formData.append('group_id', customGroupId)
        }

        const res = await fetch('/api/minimax/voice-clone', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (data.success) {
          const newVoice: ClonedVoice = {
            id: cloneVoiceId,
            voice_id: cloneVoiceId,
            voice_name: cloneVoiceName,
            created_at: new Date().toISOString(),
          }
          
          const updatedVoices = [...voices, newVoice]
          setVoices(updatedVoices)
          localStorage.setItem('cloned_voices', JSON.stringify(updatedVoices))
          
          setCloneStep(3)
        } else {
          setError(data.error || '克隆失败')
        }
      } catch (e: any) {
        setError(e.message || '克隆失败')
      } finally {
        setCloneLoading(false)
      }
    }
  }

  const handleCloneReset = () => {
    setShowCloneDialog(false)
    setCloneStep(1)
    setCloneFile(null)
    setCloneVoiceId('')
    setCloneVoiceName('')
    setClonePromptFile(null)
    setClonePromptText('')
    setError('')
  }

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm('确定要删除这个声音吗？删除后无法恢复。')) return

    try {
      const updatedVoices = voices.filter(v => v.id !== voiceId)
      setVoices(updatedVoices)
      localStorage.setItem('cloned_voices', JSON.stringify(updatedVoices))
      toast({ title: '成功', description: '声音已删除' })
    } catch (error) {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    }
  }

  const handleRenameVoice = async () => {
    if (!renamingVoice || !newVoiceName.trim()) {
      setError('请输入声音名称')
      return
    }

    try {
      const updatedVoices = voices.map(v =>
        v.id === renamingVoice.id
          ? { ...v, voice_name: newVoiceName }
          : v
      )
      setVoices(updatedVoices)
      localStorage.setItem('cloned_voices', JSON.stringify(updatedVoices))
      setRenameDialog(false)
      setRenamingVoice(null)
      setNewVoiceName('')
      toast({ title: '成功', description: '名称已更新' })
    } catch (error) {
      toast({ title: '错误', description: '重命名失败', variant: 'destructive' })
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">音色快速复刻</h1>
            <p className="text-muted-foreground">克隆您的声音并合成语音</p>
          </div>
          <Button onClick={() => setShowCloneDialog(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            克隆新声音
          </Button>
        </div>

        {/* API 配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API 配置（可选）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="留空使用配置的 API Key"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Group ID（可选）</Label>
                <Input
                  placeholder="留空使用配置的 Group ID"
                  value={customGroupId}
                  onChange={(e) => setCustomGroupId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voices Grid */}
        {voices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">还没有克隆任何声音</p>
              <p className="text-muted-foreground mb-4">点击上方按钮开始克隆您的声音</p>
              <Button onClick={() => setShowCloneDialog(true)}>克隆第一个声音</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voices.map((voice) => (
              <Card
                key={voice.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/cs/ai/${voice.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{voice.voice_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {voice.voice_id}
                      </p>
                    </div>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVoiceMenuOpen(
                            voiceMenuOpen === voice.id ? null : voice.id
                          )
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {voiceMenuOpen === voice.id && (
                        <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenamingVoice(voice)
                              setNewVoiceName(voice.voice_name)
                              setRenameDialog(true)
                              setVoiceMenuOpen(null)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                            重命名
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteVoice(voice.id)
                              setVoiceMenuOpen(null)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    创建于 {new Date(voice.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Clone Dialog */}
        <Dialog open={showCloneDialog} onOpenChange={(open) => {
          if (!open) handleCloneReset()
          setShowCloneDialog(open)
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {cloneStep === 1 && '第一步：上传克隆音频'}
                {cloneStep === 2 && '第二步：确认克隆参数'}
                {cloneStep === 3 && '克隆成功'}
              </DialogTitle>
              <DialogDescription>
                {cloneStep === 1 && '上传一段包含目标声音的音频文件（10秒-5分钟）'}
                {cloneStep === 2 && '填写自定义 Voice ID 和声音名称'}
                {cloneStep === 3 && '声音克隆已完成，现在可以开始合成语音'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {cloneStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>待克隆音频</Label>
                    <p className="text-xs text-muted-foreground">
                      支持 mp3、m4a、wav 格式，时长 10秒-5分钟，最大 20MB
                    </p>
                    <Input
                      type="file"
                      accept=".mp3,.m4a,.wav"
                      onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                    />
                    {cloneFile && (
                      <p className="text-xs text-muted-foreground">
                        已选择: {cloneFile.name} (
                        {(cloneFile.size / 1024 / 1024).toFixed(1)}MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>示例音频（可选）</Label>
                    <p className="text-xs text-muted-foreground">
                      支持 mp3、m4a、wav 格式，时长小于 8秒，最大 20MB
                    </p>
                    <Input
                      type="file"
                      accept=".mp3,.m4a,.wav"
                      onChange={(e) => setClonePromptFile(e.target.files?.[0] || null)}
                    />
                    {clonePromptFile && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          已选择: {clonePromptFile.name}
                        </p>
                        <Input
                          value={clonePromptText}
                          onChange={(e) => setClonePromptText(e.target.value)}
                          placeholder="输入示例音频的文本内容"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cloneStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>自定义 Voice ID（必填）</Label>
                    <Input
                      value={cloneVoiceId}
                      onChange={(e) => setCloneVoiceId(e.target.value)}
                      placeholder="例如: my-voice-001"
                    />
                    <p className="text-xs text-muted-foreground">
                      输入一个唯一的 Voice ID，用于标识这个克隆声音
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>声音名称（必填）</Label>
                    <Input
                      value={cloneVoiceName}
                      onChange={(e) => setCloneVoiceName(e.target.value)}
                      placeholder="例如: 张三的声音"
                    />
                  </div>

                  <div className="rounded-lg bg-muted p-3 space-y-2">
                    <p className="text-sm font-medium">克隆信息：</p>
                    <p className="text-xs text-muted-foreground">
                      音频: {cloneFile?.name}
                    </p>
                    {clonePromptFile && (
                      <p className="text-xs text-muted-foreground">
                        示例音频: {clonePromptFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {cloneStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center space-y-2">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      ✓ 声音克隆成功！
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200">
                      现在可以使用这个声音进行语音合成
                    </p>
                  </div>
                </div>
              )}

              {error && cloneStep < 3 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCloneReset}>
                {cloneStep === 3 ? '完成' : '取消'}
              </Button>
              {cloneStep < 3 && (
                <Button
                  onClick={handleCloneNext}
                  disabled={
                    cloneLoading ||
                    (cloneStep === 1 && !cloneFile)
                  }
                >
                  {cloneLoading ? '处理中...' : cloneStep === 1 ? '下一步' : '开始克隆'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
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
              <Button variant="outline" onClick={() => setRenameDialog(false)}>
                取消
              </Button>
              <Button onClick={handleRenameVoice}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
