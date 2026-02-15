'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Upload, Play, Loader2, Download, Copy, Mic } from 'lucide-react'

// 官方系统音色列表
const SYSTEM_VOICES = [
  { id: 'male-qn-qingse', name: '青涩青年音色', language: '中文' },
  { id: 'male-qn-jingying', name: '精英青年音色', language: '中文' },
  { id: 'male-qn-badao', name: '霸道青年音色', language: '中文' },
  { id: 'male-qn-daxuesheng', name: '青年大学生音色', language: '中文' },
  { id: 'female-shaonv', name: '少女音色', language: '中文' },
  { id: 'female-yujie', name: '御姐音色', language: '中文' },
  { id: 'female-chengshu', name: '成熟女性音色', language: '中文' },
  { id: 'female-tianmei', name: '甜美女性音色', language: '中文' },
  { id: 'audiobook_male_1', name: '有声书男声1', language: '中文' },
  { id: 'audiobook_male_2', name: '有声书男声2', language: '中文' },
  { id: 'audiobook_female_1', name: '有声书女声1', language: '中文' },
  { id: 'audiobook_female_2', name: '有声书女声2', language: '中文' },
]

export default function MinimaxTestPage() {
  const { toast } = useToast()

  // API 配置
  const [apiKey, setApiKey] = useState('')
  const [groupId, setGroupId] = useState('1735116464916009528')

  // 同步合成
  const [syncText, setSyncText] = useState('')
  const [syncVoiceId, setSyncVoiceId] = useState('male-qn-qingse')
  const [syncSpeed, setSyncSpeed] = useState(1)
  const [syncVol, setSyncVol] = useState(10)
  const [syncPitch, setSyncPitch] = useState(1)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncAudioUrl, setSyncAudioUrl] = useState<string | null>(null)

  // 异步合成
  const [asyncText, setAsyncText] = useState('')
  const [asyncVoiceId, setAsyncVoiceId] = useState('male-qn-qingse')
  const [asyncLoading, setAsyncLoading] = useState(false)
  const [asyncTaskId, setAsyncTaskId] = useState('')
  const [asyncStatus, setAsyncStatus] = useState<any>(null)
  const [polling, setPolling] = useState(false)

  // 音色复刻
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [cloneVoiceId, setCloneVoiceId] = useState('')
  const [cloneText, setCloneText] = useState('这是复刻后的声音测试')
  const [promptFile, setPromptFile] = useState<File | null>(null)
  const [promptText, setPromptText] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null)

  // 同步语音合成
  const handleSyncTTS = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }

    if (!syncText) {
      toast({ title: '请输入文本内容', variant: 'destructive' })
      return
    }

    setSyncLoading(true)
    setSyncAudioUrl(null)

    try {
      const response = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          model: 'speech-2.8-hd',
          text: syncText,
          voice_id: syncVoiceId,
          speed: syncSpeed,
          vol: syncVol,
          pitch: syncPitch,
        }),
      })

      if (!response.ok) {
        throw new Error('同步合成失败')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setSyncAudioUrl(url)

      toast({ title: '合成成功' })
    } catch (error) {
      console.error('[v0] Sync TTS error:', error)
      toast({
        title: '合成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setSyncLoading(false)
    }
  }

  // 异步语音合成
  const handleAsyncTTS = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }

    if (!asyncText) {
      toast({ title: '请输入文本内容', variant: 'destructive' })
      return
    }

    setAsyncLoading(true)
    setAsyncStatus(null)

    try {
      const response = await fetch('/api/minimax/async/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Group-ID': groupId,
        },
        body: JSON.stringify({
          model: 'speech-2.8-hd',
          text: asyncText,
          voice_id: asyncVoiceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '任务创建失败')
      }

      setAsyncTaskId(data.task_id)
      toast({ title: '任务已创建', description: `Task ID: ${data.task_id}` })

      // 开始轮询
      startPolling(data.task_id)
    } catch (error) {
      console.error('[v0] Async TTS error:', error)
      toast({
        title: '任务创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
      setAsyncLoading(false)
    }
  }

  // 轮询查询任务状态
  const startPolling = (taskId: string) => {
    setPolling(true)
    setAsyncLoading(false)

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/minimax/async/query?task_id=${taskId}`,
          {
            headers: {
              'X-API-Key': apiKey,
              'X-Group-ID': groupId,
            },
          }
        )

        const data = await response.json()

        // 添加 API Key 到音频 URL
        if (data.audio_file && !data.audio_file.includes('api_key')) {
          data.audio_file = `${data.audio_file}&api_key=${encodeURIComponent(apiKey)}`
        }

        setAsyncStatus(data)

        if (data.status === 'Success' || data.status === 'Failed') {
          clearInterval(interval)
          setPolling(false)
          toast({
            title: data.status === 'Success' ? '任务完成' : '任务失败',
            description: data.status === 'Failed' ? data.error : undefined,
            variant: data.status === 'Failed' ? 'destructive' : 'default',
          })
        }
      } catch (error) {
        console.error('[v0] Polling error:', error)
        clearInterval(interval)
        setPolling(false)
      }
    }, 3000)
  }

  // 音色复刻
  const handleVoiceClone = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }

    if (!cloneFile) {
      toast({ title: '请上传复刻音频', variant: 'destructive' })
      return
    }

    if (!cloneVoiceId) {
      toast({ title: '请输入音色ID', variant: 'destructive' })
      return
    }

    setCloneLoading(true)
    setCloneAudioUrl(null)

    try {
      // 1. 上传复刻音频
      const formData = new FormData()
      formData.append('file', cloneFile)
      formData.append('purpose', 'voice_clone')

      const uploadRes = await fetch('/api/minimax/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || '文件上传失败')
      }

      // 2. 上传提示音频（可选）
      let clonePrompt = undefined
      if (promptFile && promptText) {
        const promptFormData = new FormData()
        promptFormData.append('file', promptFile)
        promptFormData.append('purpose', 'prompt_audio')

        const promptRes = await fetch('/api/minimax/upload', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
          },
          body: promptFormData,
        })

        const promptData = await promptRes.json()

        if (promptRes.ok) {
          clonePrompt = {
            prompt_audio: promptData.file_id,
            prompt_text: promptText,
          }
        }
      }

      // 3. 调用音色复刻 API
      const cloneRes = await fetch('/api/minimax/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          file_id: uploadData.file_id,
          voice_id: cloneVoiceId,
          clone_prompt: clonePrompt,
          text: cloneText,
          model: 'speech-2.8-hd',
        }),
      })

      if (!cloneRes.ok) {
        throw new Error('音色复刻失败')
      }

      const blob = await cloneRes.blob()
      const url = URL.createObjectURL(blob)
      setCloneAudioUrl(url)

      toast({
        title: '复刻成功',
        description: `音色 ID: ${cloneVoiceId}`,
      })
    } catch (error) {
      console.error('[v0] Clone error:', error)
      toast({
        title: '复刻失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setCloneLoading(false)
    }
  }

  // 下载音频
  const downloadAudio = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 头部 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">MiniMax TTS API 测试</h1>
          <p className="text-muted-foreground">
            完整的 MiniMax 语音合成服务测试页面，支持同步/异步合成、音色复刻等功能
          </p>
        </div>

        {/* API 配置 */}
        <Card>
          <CardHeader>
            <CardTitle>API 配置</CardTitle>
            <CardDescription>配置您的 MiniMax API 凭证</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="输入您的 API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID</Label>
                <Input
                  id="groupId"
                  placeholder="默认: 1735116464916009528"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能标签页 */}
        <Tabs defaultValue="sync" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sync">同步合成</TabsTrigger>
            <TabsTrigger value="async">异步合成</TabsTrigger>
            <TabsTrigger value="clone">音色复刻</TabsTrigger>
            <TabsTrigger value="voices">音色列表</TabsTrigger>
          </TabsList>

          {/* 同步合成 */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>同步语音合成</CardTitle>
                <CardDescription>
                  实时生成语音（最多 10,000 字符）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncText">文本内容 *</Label>
                    <div className="text-xs text-muted-foreground">
                      {syncText.length} / 10,000 字符
                    </div>
                  </div>
                  <Textarea
                    id="syncText"
                    placeholder="输入要合成的文本..."
                    rows={4}
                    maxLength={10000}
                    value={syncText}
                    onChange={(e) => setSyncText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncVoice">选择音色</Label>
                  <Select value={syncVoiceId} onValueChange={setSyncVoiceId}>
                    <SelectTrigger id="syncVoice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_VOICES.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>语速: {syncSpeed}</Label>
                    <Slider
                      value={[syncSpeed]}
                      onValueChange={(v) => setSyncSpeed(v[0])}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>音量: {syncVol}</Label>
                    <Slider
                      value={[syncVol]}
                      onValueChange={(v) => setSyncVol(v[0])}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>音调: {syncPitch}</Label>
                    <Slider
                      value={[syncPitch]}
                      onValueChange={(v) => setSyncPitch(v[0])}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSyncTTS}
                  disabled={syncLoading}
                  className="w-full"
                >
                  {syncLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      合成中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      开始合成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {syncAudioUrl && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>生成结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <audio controls src={syncAudioUrl} className="w-full" />
                  <Button
                    onClick={() => downloadAudio(syncAudioUrl, 'minimax-sync.mp3')}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载音频
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 异步合成 */}
          <TabsContent value="async" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>异步语音合成</CardTitle>
                <CardDescription>
                  长文本合成（最多 100,000 字符）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="asyncText">文本内容 *</Label>
                    <div className="text-xs text-muted-foreground">
                      {asyncText.length} / 100,000 字符
                    </div>
                  </div>
                  <Textarea
                    id="asyncText"
                    placeholder="输入要合成的长文本..."
                    rows={6}
                    maxLength={100000}
                    value={asyncText}
                    onChange={(e) => setAsyncText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asyncVoice">选择音色</Label>
                  <Select value={asyncVoiceId} onValueChange={setAsyncVoiceId}>
                    <SelectTrigger id="asyncVoice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_VOICES.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAsyncTTS}
                  disabled={asyncLoading || polling}
                  className="w-full"
                >
                  {asyncLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建任务中...
                    </>
                  ) : polling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      创建任务
                    </>
                  )}
                </Button>

                {asyncTaskId && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Task ID</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {asyncTaskId}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(asyncTaskId)
                          toast({ title: '已复制 Task ID' })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {asyncStatus && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>任务状态</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">状态</span>
                      <span className="font-medium">{asyncStatus.status}</span>
                    </div>
                    {asyncStatus.file_id && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">File ID</span>
                        <span className="font-mono text-xs">{asyncStatus.file_id}</span>
                      </div>
                    )}
                  </div>

                  {asyncStatus.audio_file && (
                    <>
                      <audio controls src={asyncStatus.audio_file} className="w-full" />
                      <Button
                        onClick={() =>
                          downloadAudio(
                            asyncStatus.audio_file,
                            `minimax-async-${asyncTaskId}.mp3`
                          )
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载音频
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 音色复刻 */}
          <TabsContent value="clone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>音色快速复刻</CardTitle>
                <CardDescription>
                  上传音频文件克隆音色（支持 mp3, wav 格式）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cloneFile">复刻音频 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cloneFile"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {cloneFile && (
                    <p className="text-xs text-muted-foreground">
                      已选择: {cloneFile.name} ({(cloneFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cloneVoiceId">音色 ID *</Label>
                  <Input
                    id="cloneVoiceId"
                    placeholder="例如: my-custom-voice"
                    value={cloneVoiceId}
                    onChange={(e) => setCloneVoiceId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    自定义音色的唯一标识符，用于后续调用
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cloneText">试听文本</Label>
                  <Textarea
                    id="cloneText"
                    placeholder="输入试听文本..."
                    rows={2}
                    value={cloneText}
                    onChange={(e) => setCloneText(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <Label>提示音频（可选）</Label>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setPromptFile(e.target.files?.[0] || null)}
                    />
                    {promptFile && (
                      <p className="text-xs text-muted-foreground">
                        {promptFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promptText">提示文本</Label>
                    <Textarea
                      id="promptText"
                      placeholder="提示音频对应的文本..."
                      rows={2}
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleVoiceClone}
                  disabled={cloneLoading}
                  className="w-full"
                >
                  {cloneLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      复刻中...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      开始复刻
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {cloneAudioUrl && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>复刻结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <audio controls src={cloneAudioUrl} className="w-full" />
                  <Button
                    onClick={() =>
                      downloadAudio(cloneAudioUrl, `${cloneVoiceId}.mp3`)
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载音频
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 音色列表 */}
          <TabsContent value="voices">
            <Card>
              <CardHeader>
                <CardTitle>系统音色列表</CardTitle>
                <CardDescription>
                  MiniMax 提供的 {SYSTEM_VOICES.length} 个预设音色
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {SYSTEM_VOICES.map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.id}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {voice.language}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
