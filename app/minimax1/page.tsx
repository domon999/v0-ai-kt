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
import { Loader2, Copy, Download } from 'lucide-react'

const models = [
  { id: 'speech-2.8-hd', name: 'speech-2.8-hd - 精准还原真实语气细节' },
  { id: 'speech-2.6-hd', name: 'speech-2.6-hd - 超低延时，更高自然度' },
  { id: 'speech-2.8-turbo', name: 'speech-2.8-turbo - 更快更优惠' },
  { id: 'speech-2.6-turbo', name: 'speech-2.6-turbo - 极速版（推荐）' },
  { id: 'speech-02-hd', name: 'speech-02-hd - 出色的韵律和稳定性' },
  { id: 'speech-02-turbo', name: 'speech-02-turbo - 小语种能力加强' },
]

const popularVoices = [
  { id: 'male-qn-qingse', name: '青涩青年音色' },
  { id: 'male-qn-jingying', name: '精英青年音色' },
  { id: 'male-qn-badao', name: '霸道青年音色' },
  { id: 'male-qn-daxuesheng', name: '青年大学生音色' },
  { id: 'female-shaonv', name: '少女音色' },
  { id: 'female-yujie', name: '御姐音色' },
  { id: 'female-chengshu', name: '成熟女性音色' },
  { id: 'female-tianmei', name: '甜美女性音色' },
  { id: 'audiobook_male_1', name: '有声书男声1' },
]

export default function Minimax1Page() {
  const { toast } = useToast()

  // API 配置
  const [apiKey, setApiKey] = useState('')
  const [groupId, setGroupId] = useState('1735116464916009528')

  // 同步合成
  const [syncModel, setSyncModel] = useState('speech-2.6-turbo')
  const [syncVoice, setSyncVoice] = useState('male-qn-qingse')
  const [syncText, setSyncText] = useState('')
  const [syncSpeed, setSyncSpeed] = useState([1.0])
  const [syncVol, setSyncVol] = useState([1.0])
  const [syncPitch, setSyncPitch] = useState([0])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncAudio, setSyncAudio] = useState('')

  // 异步合成
  const [asyncModel, setAsyncModel] = useState('speech-2.8-hd')
  const [asyncVoice, setAsyncVoice] = useState('audiobook_male_1')
  const [asyncText, setAsyncText] = useState('')
  const [asyncLoading, setAsyncLoading] = useState(false)
  const [asyncTaskId, setAsyncTaskId] = useState('')
  const [asyncStatus, setAsyncStatus] = useState('')
  const [asyncAudio, setAsyncAudio] = useState('')
  const [polling, setPolling] = useState(false)

  // 音色复刻
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [cloneVoiceId, setCloneVoiceId] = useState('')
  const [clonePromptFile, setClonePromptFile] = useState<File | null>(null)
  const [clonePromptText, setClonePromptText] = useState('')
  const [cloneText, setCloneText] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneAudio, setCloneAudio] = useState('')

  // 同步语音合成
  const handleSyncTTS = async () => {
    if (!syncText.trim()) {
      toast({ description: '请输入要合成的文本', variant: 'destructive' })
      return
    }

    if (syncText.length > 10000) {
      toast({ description: '同步合成最多支持 10,000 字符', variant: 'destructive' })
      return
    }

    setSyncLoading(true)
    setSyncAudio('')

    try {
      console.log('[v0] 开始同步语音合成:', { model: syncModel, voice: syncVoice, textLength: syncText.length })

      const response = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          model: syncModel,
          text: syncText,
          voice_id: syncVoice,
          speed: syncSpeed[0],
          vol: syncVol[0],
          pitch: syncPitch[0],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '合成失败')
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      setSyncAudio(audioUrl)

      toast({ description: '语音合成成功！' })
    } catch (error) {
      console.error('[v0] 同步合成失败:', error)
      toast({
        description: error instanceof Error ? error.message : '合成失败',
        variant: 'destructive',
      })
    } finally {
      setSyncLoading(false)
    }
  }

  // 异步任务创建
  const handleAsyncCreate = async () => {
    if (!asyncText.trim()) {
      toast({ description: '请输入要合成的文本', variant: 'destructive' })
      return
    }

    if (asyncText.length > 100000) {
      toast({ description: '异步合成最多支持 100,000 字符', variant: 'destructive' })
      return
    }

    setAsyncLoading(true)
    setAsyncTaskId('')
    setAsyncStatus('')
    setAsyncAudio('')

    try {
      console.log('[v0] 创建异步任务:', { model: asyncModel, voice: asyncVoice, textLength: asyncText.length })

      const response = await fetch('/api/minimax/async/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Group-ID': groupId,
        },
        body: JSON.stringify({
          model: asyncModel,
          text: asyncText,
          voice_id: asyncVoice,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建任务失败')
      }

      setAsyncTaskId(data.task_id)
      setAsyncStatus(data.status)
      toast({ description: '任务已创建，正在生成中...' })

      // 开始轮询
      startPolling(data.task_id)
    } catch (error) {
      console.error('[v0] 创建异步任务失败:', error)
      toast({
        description: error instanceof Error ? error.message : '创建任务失败',
        variant: 'destructive',
      })
    } finally {
      setAsyncLoading(false)
    }
  }

  // 轮询查询任务状态
  const startPolling = (taskId: string) => {
    setPolling(true)

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/minimax/async/query?task_id=${taskId}&api_key=${apiKey}&group_id=${groupId}`
        )
        const data = await response.json()

        console.log('[v0] 任务状态:', data.status)
        setAsyncStatus(data.status)

        if (data.status === 'Success') {
          // 使用代理 API 获取音频
          const proxyUrl = `/api/minimax/audio?file_id=${data.audio_file}&api_key=${apiKey}`
          setAsyncAudio(proxyUrl)
          clearInterval(interval)
          setPolling(false)
          toast({ description: '语音合成完成！' })
        } else if (data.status === 'Failed') {
          clearInterval(interval)
          setPolling(false)
          toast({ description: '语音合成失败', variant: 'destructive' })
        }
      } catch (error) {
        console.error('[v0] 查询任务失败:', error)
        clearInterval(interval)
        setPolling(false)
      }
    }, 3000)
  }

  // 音色复刻
  const handleClone = async () => {
    if (!cloneFile) {
      toast({ description: '请上传复刻音频文件', variant: 'destructive' })
      return
    }

    if (!cloneVoiceId.trim()) {
      toast({ description: '请输入音色ID', variant: 'destructive' })
      return
    }

    if (!cloneText.trim()) {
      toast({ description: '请输入试听文本', variant: 'destructive' })
      return
    }

    setCloneLoading(true)
    setCloneAudio('')

    try {
      console.log('[v0] 开始音色复刻...')

      // 1. 上传复刻音频
      const formData1 = new FormData()
      formData1.append('file', cloneFile)
      formData1.append('purpose', 'voice_clone')

      const uploadResponse = await fetch('/api/minimax/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData1,
      })

      const uploadData = await uploadResponse.json()
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || '上传音频失败')
      }

      const fileId = uploadData.file_id

      // 2. 上传提示音频（如果有）
      let promptFileId = null
      if (clonePromptFile) {
        const formData2 = new FormData()
        formData2.append('file', clonePromptFile)
        formData2.append('purpose', 'prompt_audio')

        const promptResponse = await fetch('/api/minimax/upload', {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
          },
          body: formData2,
        })

        const promptData = await promptResponse.json()
        if (promptResponse.ok) {
          promptFileId = promptData.file_id
        }
      }

      // 3. 调用音色复刻API
      const cloneResponse = await fetch('/api/minimax/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          file_id: fileId,
          voice_id: cloneVoiceId,
          clone_prompt: {
            prompt_audio: promptFileId,
            prompt_text: clonePromptText || undefined,
          },
          text: cloneText,
          model: 'speech-2.8-hd',
        }),
      })

      const cloneData = await cloneResponse.json()
      if (!cloneResponse.ok) {
        throw new Error(cloneData.error || '音色复刻失败')
      }

      // 使用代理 API 获取音频
      const proxyUrl = `/api/minimax/audio?file_id=${cloneData.audio_file}&api_key=${apiKey}`
      setCloneAudio(proxyUrl)
      toast({ description: `音色复刻成功！音色ID: ${cloneData.voice_id}` })
    } catch (error) {
      console.error('[v0] 音色复刻失败:', error)
      toast({
        description: error instanceof Error ? error.message : '音色复刻失败',
        variant: 'destructive',
      })
    } finally {
      setCloneLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ description: '已复制到剪贴板' })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MiniMax TTS 测试页面</h1>
        <p className="text-muted-foreground">测试 MiniMax 语音合成 API 的各项功能</p>
      </div>

      {/* API 配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API 配置</CardTitle>
          <CardDescription>输入您的 MiniMax API Key 和 GroupID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="输入您的 MiniMax API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Group ID</Label>
              <Input
                id="groupId"
                placeholder="Group ID（可选）"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能模块 */}
      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync">同步合成</TabsTrigger>
          <TabsTrigger value="async">异步合成</TabsTrigger>
          <TabsTrigger value="clone">音色复刻</TabsTrigger>
          <TabsTrigger value="voices">音色列表</TabsTrigger>
        </TabsList>

        {/* 同步语音合成 */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>同步语音合成</CardTitle>
              <CardDescription>实时生成语音，最长支持 10,000 字符</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>语音模型</Label>
                  <Select value={syncModel} onValueChange={setSyncModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>音色</Label>
                  <Select value={syncVoice} onValueChange={setSyncVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {popularVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>语速: {syncSpeed[0].toFixed(1)}</Label>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={syncSpeed}
                    onValueChange={setSyncSpeed}
                  />
                </div>

                <div className="space-y-2">
                  <Label>音量: {syncVol[0].toFixed(1)}</Label>
                  <Slider
                    min={0}
                    max={2.0}
                    step={0.1}
                    value={syncVol}
                    onValueChange={setSyncVol}
                  />
                </div>

                <div className="space-y-2">
                  <Label>音调: {syncPitch[0]}</Label>
                  <Slider
                    min={-12}
                    max={12}
                    step={1}
                    value={syncPitch}
                    onValueChange={setSyncPitch}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncText">
                  文本内容 * ({syncText.length} / 10,000 字符 / 预计消耗约 {Math.ceil(syncText.length * 1)} 积分)
                </Label>
                <Textarea
                  id="syncText"
                  placeholder="输入要合成的文本..."
                  value={syncText}
                  onChange={(e) => setSyncText(e.target.value)}
                  rows={6}
                  maxLength={10000}
                />
              </div>

              <Button onClick={handleSyncTTS} disabled={syncLoading || !syncText.trim()}>
                {syncLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {syncLoading ? '合成中...' : '开始合成'}
              </Button>

              {syncAudio && (
                <div className="space-y-2">
                  <Label>生成的音频</Label>
                  <audio src={syncAudio} controls className="w-full" />
                  <Button variant="outline" size="sm" onClick={() => {
                    const a = document.createElement('a')
                    a.href = syncAudio
                    a.download = 'sync-audio.mp3'
                    a.click()
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    下载音频
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 异步语音合成 */}
        <TabsContent value="async">
          <Card>
            <CardHeader>
              <CardTitle>异步语音合成</CardTitle>
              <CardDescription>适用于长文本合成，最长支持 100,000 字符</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>语音模型</Label>
                  <Select value={asyncModel} onValueChange={setAsyncModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>音色</Label>
                  <Select value={asyncVoice} onValueChange={setAsyncVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {popularVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asyncText">
                  文本内容 * ({asyncText.length} / 100,000 字符 / 预计消耗约 {Math.ceil(asyncText.length * 1)} 积分)
                </Label>
                <Textarea
                  id="asyncText"
                  placeholder="输入要合成的长文本..."
                  value={asyncText}
                  onChange={(e) => setAsyncText(e.target.value)}
                  rows={8}
                  maxLength={100000}
                />
              </div>

              <Button onClick={handleAsyncCreate} disabled={asyncLoading || !asyncText.trim() || polling}>
                {asyncLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {asyncLoading ? '创建中...' : '创建合成任务'}
              </Button>

              {asyncTaskId && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Label>任务ID:</Label>
                    <code className="text-sm">{asyncTaskId}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(asyncTaskId)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label>状态:</Label>
                    <span className="font-medium">{asyncStatus}</span>
                    {polling && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>

                  {asyncAudio && (
                    <div className="space-y-2">
                      <Label>生成的音频</Label>
                      <audio src={asyncAudio} controls className="w-full" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(asyncAudio)}>
                        <Copy className="mr-2 h-4 w-4" />
                        复制音频链接
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 音色快速复刻 */}
        <TabsContent value="clone">
          <Card>
            <CardHeader>
              <CardTitle>音色快速复刻</CardTitle>
              <CardDescription>上传音频文件克隆音色</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cloneFile">复刻音频文件 * (mp3/wav)</Label>
                <Input
                  id="cloneFile"
                  type="file"
                  accept=".mp3,.wav"
                  onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloneVoiceId">音色ID *</Label>
                <Input
                  id="cloneVoiceId"
                  placeholder="输入自定义音色ID，如: my-voice-001"
                  value={cloneVoiceId}
                  onChange={(e) => setCloneVoiceId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clonePromptFile">提示音频（可选）</Label>
                <Input
                  id="clonePromptFile"
                  type="file"
                  accept=".mp3,.wav"
                  onChange={(e) => setClonePromptFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clonePromptText">提示文本（可选）</Label>
                <Textarea
                  id="clonePromptText"
                  placeholder="输入提示文本..."
                  value={clonePromptText}
                  onChange={(e) => setClonePromptText(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloneText">
                  试听文本 * ({cloneText.length} 字符 / 预计消耗约 {Math.ceil(cloneText.length * 1)} 积分)
                </Label>
                <Textarea
                  id="cloneText"
                  placeholder="输入试听文本，用于测试复刻效果..."
                  value={cloneText}
                  onChange={(e) => setCloneText(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleClone} disabled={cloneLoading || !cloneFile || !cloneVoiceId.trim() || !cloneText.trim()}>
                {cloneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cloneLoading ? '复刻中...' : '开始复刻'}
              </Button>

              {cloneAudio && (
                <div className="space-y-2">
                  <Label>复刻后的试听音频</Label>
                  <audio src={cloneAudio} controls className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统音色列表 */}
        <TabsContent value="voices">
          <Card>
            <CardHeader>
              <CardTitle>系统音色列表</CardTitle>
              <CardDescription>MiniMax 提供的预设音色</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {popularVoices.map((voice) => (
                  <div key={voice.id} className="p-4 border rounded-lg">
                    <div className="font-medium">{voice.name}</div>
                    <code className="text-xs text-muted-foreground">{voice.id}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
