'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// ========== 官方系统音色列表 ==========
const VOICE_CATEGORIES = [
  {
    label: '中文普通话 - 基础',
    voices: [
      { id: 'male-qn-qingse', name: '青涩青年' },
      { id: 'male-qn-jingying', name: '精英青年' },
      { id: 'male-qn-badao', name: '霸道青年' },
      { id: 'male-qn-daxuesheng', name: '青年大学生' },
      { id: 'female-shaonv', name: '少女' },
      { id: 'female-yujie', name: '御姐' },
      { id: 'female-chengshu', name: '成熟女性' },
      { id: 'female-tianmei', name: '甜美女性' },
    ],
  },
  {
    label: '中文普通话 - 精品',
    voices: [
      { id: 'male-qn-qingse-jingpin', name: '青涩青年-beta' },
      { id: 'male-qn-jingying-jingpin', name: '精英青年-beta' },
      { id: 'male-qn-badao-jingpin', name: '霸道青年-beta' },
      { id: 'male-qn-daxuesheng-jingpin', name: '青年大学生-beta' },
      { id: 'female-shaonv-jingpin', name: '少女-beta' },
      { id: 'female-yujie-jingpin', name: '御姐-beta' },
      { id: 'female-chengshu-jingpin', name: '成熟女性-beta' },
      { id: 'female-tianmei-jingpin', name: '甜美女性-beta' },
    ],
  },
  {
    label: '中文普通话 - 特色',
    voices: [
      { id: 'clever_boy', name: '聪明男童' },
      { id: 'cute_boy', name: '可爱男童' },
      { id: 'lovely_girl', name: '萌萌女童' },
      { id: 'cartoon_pig', name: '卡通猪小琪' },
      { id: 'bingjiao_didi', name: '病娇弟弟' },
      { id: 'junlang_nanyou', name: '俊朗男友' },
      { id: 'chunzhen_xuedi', name: '纯真学弟' },
      { id: 'lengdan_xiongzhang', name: '冷淡学长' },
      { id: 'badao_shaoye', name: '霸道少爷' },
      { id: 'tianxin_xiaoling', name: '甜心小玲' },
      { id: 'qiaopi_mengmei', name: '俏皮萌妹' },
      { id: 'wumei_yujie', name: '妩媚御姐' },
      { id: 'diadia_xuemei', name: '嗲嗲学妹' },
      { id: 'danya_xuejie', name: '淡雅学姐' },
    ],
  },
  {
    label: '中文普通话 - 场景',
    voices: [
      { id: 'Chinese (Mandarin)_Reliable_Executive', name: '沉稳高管' },
      { id: 'Chinese (Mandarin)_News_Anchor', name: '新闻女声' },
      { id: 'Chinese (Mandarin)_Mature_Woman', name: '傲娇御姐' },
      { id: 'Chinese (Mandarin)_Unrestrained_Young_Man', name: '不羁青年' },
      { id: 'Arrogant_Miss', name: '嚣张小姐' },
      { id: 'Robot_Armor', name: '机械战甲' },
      { id: 'Chinese (Mandarin)_Gentleman', name: '温润男声' },
      { id: 'Chinese (Mandarin)_Warm_Bestie', name: '温暖闺蜜' },
      { id: 'Chinese (Mandarin)_Male_Announcer', name: '播报男声' },
      { id: 'Chinese (Mandarin)_Sweet_Lady', name: '甜美女声' },
      { id: 'Chinese (Mandarin)_Radio_Host', name: '电台男主播' },
    ],
  },
  {
    label: '英文',
    voices: [
      { id: 'Santa_Claus', name: 'Santa Claus' },
      { id: 'Grinch', name: 'Grinch' },
      { id: 'Arnold', name: 'Arnold' },
      { id: 'Charming_Lady', name: 'Charming Lady' },
      { id: 'Sweet_Girl', name: 'Sweet Girl' },
      { id: 'Attractive_Girl', name: 'Attractive Girl' },
      { id: 'English_Trustworthy_Man', name: 'Trustworthy Man' },
      { id: 'English_Graceful_Lady', name: 'Graceful Lady' },
    ],
  },
  {
    label: '日文',
    voices: [
      { id: 'Japanese_IntellectualSenior', name: 'Intellectual Senior' },
      { id: 'Japanese_DecisivePrincess', name: 'Decisive Princess' },
      { id: 'Japanese_LoyalKnight', name: 'Loyal Knight' },
      { id: 'Japanese_KindLady', name: 'Kind Lady' },
    ],
  },
]

// 支持的模型
const MODELS = [
  { id: 'speech-2.8-hd', name: 'speech-2.8-hd (推荐)', desc: '精准还原真实语气细节，全面提升音色相似度' },
  { id: 'speech-2.8-turbo', name: 'speech-2.8-turbo', desc: '精准还原真实语气细节，更快更优惠' },
  { id: 'speech-2.6-hd', name: 'speech-2.6-hd', desc: '超低延时，归一化升级，更高自然度' },
  { id: 'speech-2.6-turbo', name: 'speech-2.6-turbo', desc: '极速版，更快更优惠' },
  { id: 'speech-02-hd', name: 'speech-02-hd', desc: '出色韵律，稳定性和复刻相似度' },
  { id: 'speech-02-turbo', name: 'speech-02-turbo', desc: '出色韵律，小语种能力加强' },
]

export function TTSTestClient() {
  const [text, setText] = useState('你好，欢迎使用MiniMax语音合成测试页面。这是一段测试文本，用于验证语音合成功能是否正常工作。')
  const [voiceId, setVoiceId] = useState('female-shaonv')
  const [model, setModel] = useState('speech-2.8-hd')
  const [speed, setSpeed] = useState(1)
  const [vol, setVol] = useState(10)
  const [pitch, setPitch] = useState(1)
  const [customApiKey, setCustomApiKey] = useState('')
  const [customGroupId, setCustomGroupId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('sync')
  const [asyncTaskId, setAsyncTaskId] = useState('')
  const [asyncStatus, setAsyncStatus] = useState('')
  const [asyncFileId, setAsyncFileId] = useState('')
  const [asyncLoading, setAsyncLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 50))
  }

  // ========== 同步语音合成 ==========
  const handleSyncTTS = async () => {
    if (!text.trim()) {
      setError('请输入文本')
      return
    }
    setLoading(true)
    setError('')
    setAudioUrl(null)
    const usingCustomKey = !!customApiKey
    addLog(`开始同步合成: model=${model}, voice=${voiceId}, text=${text.length}字, 使用${usingCustomKey ? '自定义' : '配置的'} API Key`)

    try {
      const requestBody: any = {
        model,
        text: text.trim(),
        voice_id: voiceId,
        speed,
        vol,
        pitch,
      }

      // 如果提供了自定义 API Key，添加到请求中
      if (customApiKey) {
        requestBody.api_key = customApiKey
        addLog('使用自定义 API Key')
      }
      if (customGroupId) {
        requestBody.group_id = customGroupId
        addLog(`使用自定义 Group ID: ${customGroupId}`)
      }

      const res = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      addLog(`响应状态: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        // 尝试解析 JSON 错误
        const contentType = res.headers.get('Content-Type') || ''
        if (contentType.includes('application/json')) {
          const errData = await res.json()
          const errMsg = errData.error || `HTTP ${res.status}`
          setError(errMsg)
          addLog(`错误: ${errMsg}`)
        } else {
          setError(`HTTP ${res.status}: ${res.statusText}`)
          addLog(`错误: HTTP ${res.status}`)
        }
        return
      }

      // 检查返回的是否是音频数据
      const contentType = res.headers.get('Content-Type') || ''
      addLog(`Content-Type: ${contentType}`)

      if (contentType.includes('audio/')) {
        const blob = await res.blob()
        addLog(`音频大小: ${(blob.size / 1024).toFixed(1)} KB`)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        addLog('同步合成成功，可以播放')
      } else {
        // 可能是 JSON 响应
        const data = await res.json()
        if (data.success && data.data?.audioUrl) {
          setAudioUrl(data.data.audioUrl)
          addLog('同步合成成功（URL模式）')
        } else {
          setError(data.error || '未知错误')
          addLog(`错误: ${data.error || '未知响应格式'}`)
        }
      }
    } catch (e: any) {
      const msg = e.message || '请求失败'
      setError(msg)
      addLog(`异常: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // ========== 异步语音合成 ==========
  const handleAsyncCreate = async () => {
    if (!text.trim()) {
      setError('请输入文本')
      return
    }
    setAsyncLoading(true)
    setError('')
    setAsyncTaskId('')
    setAsyncStatus('')
    setAsyncFileId('')
    const usingCustomKey = !!customApiKey
    addLog(`开始异步合成: model=${model}, voice=${voiceId}, text=${text.length}字, 使用${usingCustomKey ? '自定义' : '配置的'} API Key`)

    try {
      const requestBody: any = {
        model,
        text: text.trim(),
        voice_id: voiceId,
        speed,
        vol,
        pitch,
      }

      // 如果提供了自定义 API Key，添加到请求中
      if (customApiKey) {
        requestBody.api_key = customApiKey
      }
      if (customGroupId) {
        requestBody.group_id = customGroupId
      }

      const res = await fetch('/api/minimax/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      addLog(`异步创建响应: ${JSON.stringify(data)}`)

      if (data.success && data.data?.taskId) {
        setAsyncTaskId(data.data.taskId)
        setAsyncStatus('创建成功')
        addLog(`任务创建成功: task_id=${data.data.taskId}`)
      } else {
        setError(data.error || '创建任务失败')
        addLog(`错误: ${data.error || '创建任务失败'}`)
      }
    } catch (e: any) {
      setError(e.message || '请求失败')
      addLog(`异常: ${e.message}`)
    } finally {
      setAsyncLoading(false)
    }
  }

  const handleAsyncQuery = async () => {
    if (!asyncTaskId) {
      setError('请先创建异步任务')
      return
    }
    setAsyncLoading(true)
    addLog(`查询任务状态: task_id=${asyncTaskId}`)

    try {
      const res = await fetch(`/api/minimax/async?task_id=${asyncTaskId}`)
      const data = await res.json()
      addLog(`查询响应: ${JSON.stringify(data)}`)

      if (data.success) {
        const status = data.data?.status || 'unknown'
        setAsyncStatus(status)

        if (data.data?.file_id) {
          setAsyncFileId(data.data.file_id)
          addLog(`任务完成: file_id=${data.data.file_id}`)
        } else {
          addLog(`任务状态: ${status}`)
        }
      } else {
        setError(data.error || '查询失败')
      }
    } catch (e: any) {
      setError(e.message || '查询失败')
    } finally {
      setAsyncLoading(false)
    }
  }

  const handleAsyncDownload = async () => {
    if (!asyncFileId) {
      setError('请先等待任务完成')
      return
    }
    setAsyncLoading(true)
    addLog(`下载音频: file_id=${asyncFileId}`)

    try {
      const res = await fetch(`/api/minimax/async/download?file_id=${asyncFileId}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `下载失败: HTTP ${res.status}`)
        return
      }

      const blob = await res.blob()
      addLog(`音频大小: ${(blob.size / 1024).toFixed(1)} KB`)
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      addLog('下载成功，可以播放')
    } catch (e: any) {
      setError(e.message || '下载失败')
    } finally {
      setAsyncLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MiniMax TTS 测试</h1>
          <p className="mt-1 text-muted-foreground">
            测试 MiniMax 语音合成 API，可自定义 API Key 或使用 /glht/api 中的配置
          </p>
        </div>

        {/* API 配置（可选） */}
        <Card>
          <CardHeader>
            <CardTitle>API 配置（可选）</CardTitle>
            <CardDescription>
              留空则使用 /glht/api 中配置的 MiniMax API Key；填写则使用此处的配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="留空使用配置的 API Key"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-id">Group ID（可选）</Label>
              <Input
                id="group-id"
                placeholder="留空使用配置的 Group ID"
                value={customGroupId}
                onChange={(e) => setCustomGroupId(e.target.value)}
              />
            </div>
            {(customApiKey || customGroupId) && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <Badge variant="secondary">使用自定义配置</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomApiKey('')
                    setCustomGroupId('')
                  }}
                >
                  清除
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 文本输入 */}
        <Card>
          <CardHeader>
            <CardTitle>文本输入</CardTitle>
            <CardDescription>输入要合成语音的文本（同步模式最大 10,000 字，异步模式最大 100,000 字）</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="输入待合成的文本..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="resize-y"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              当前 {text.length} 字
            </p>
          </CardContent>
        </Card>

        {/* 参数设置 */}
        <Card>
          <CardHeader>
            <CardTitle>参数设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 模型选择 */}
            <div className="space-y-2">
              <Label>模型</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {MODELS.find((m) => m.id === model)?.desc}
              </p>
            </div>

            {/* 声音选择 */}
            <div className="space-y-2">
              <Label>声音 (voice_id: {voiceId})</Label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {VOICE_CATEGORIES.map((cat) => (
                    <SelectGroup key={cat.label}>
                      <SelectLabel>{cat.label}</SelectLabel>
                      {cat.voices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 速度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>语速 (speed)</Label>
                <Badge variant="outline">{speed.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={0.5}
                max={2.0}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">范围 0.5 ~ 2.0，默认 1.0</p>
            </div>

            {/* 音量 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>音量 (vol)</Label>
                <Badge variant="outline">{vol}</Badge>
              </div>
              <Slider
                value={[vol]}
                onValueChange={([v]) => setVol(v)}
                min={1}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground">范围 1 ~ 20，默认 10</p>
            </div>

            {/* 音调 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>音调 (pitch)</Label>
                <Badge variant="outline">{pitch}</Badge>
              </div>
              <Slider
                value={[pitch]}
                onValueChange={([v]) => setPitch(v)}
                min={-12}
                max={12}
                step={1}
              />
              <p className="text-xs text-muted-foreground">范围 -12 ~ 12，默认 1</p>
            </div>
          </CardContent>
        </Card>

        {/* 合成操作 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sync">同步合成</TabsTrigger>
            <TabsTrigger value="async">异步合成</TabsTrigger>
          </TabsList>

          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>同步语音合成</CardTitle>
                <CardDescription>
                  调用 /api/minimax/sync (POST) - 直接返回音频流，适合短文本（10,000字以内）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSyncTTS}
                  disabled={loading || !text.trim()}
                  className="w-full"
                >
                  {loading ? '合成中...' : '开始同步合成'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="async">
            <Card>
              <CardHeader>
                <CardTitle>异步语音合成</CardTitle>
                <CardDescription>
                  分三步：1.创建任务 2.查询状态 3.下载音频，适合长文本（100,000字以内）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleAsyncCreate}
                    disabled={asyncLoading || !text.trim()}
                  >
                    {asyncLoading ? '处理中...' : '1. 创建任务'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAsyncQuery}
                    disabled={asyncLoading || !asyncTaskId}
                  >
                    2. 查询状态
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAsyncDownload}
                    disabled={asyncLoading || !asyncFileId}
                  >
                    3. 下载音频
                  </Button>
                </div>
                {asyncTaskId && (
                  <p className="text-sm">
                    task_id: <code className="rounded bg-muted px-1 py-0.5">{asyncTaskId}</code>
                  </p>
                )}
                {asyncStatus && (
                  <p className="text-sm">
                    状态: <Badge variant="secondary">{asyncStatus}</Badge>
                  </p>
                )}
                {asyncFileId && (
                  <p className="text-sm">
                    file_id: <code className="rounded bg-muted px-1 py-0.5">{asyncFileId}</code>
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 错误提示 */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 音频播放 */}
        {audioUrl && (
          <Card>
            <CardHeader>
              <CardTitle>音频播放</CardTitle>
            </CardHeader>
            <CardContent>
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full"
                autoPlay
              />
            </CardContent>
          </Card>
        )}

        {/* 调试日志 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>调试日志</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                清空
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">暂无日志...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
