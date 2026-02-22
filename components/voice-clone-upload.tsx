'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface VoiceCloneUploadProps {
  model: string
  customApiKey: string
  customGroupId: string
  onLog: (msg: string) => void
  onError: (msg: string) => void
}

export function VoiceCloneUpload({
  model,
  customApiKey,
  customGroupId,
  onLog,
  onError,
}: VoiceCloneUploadProps) {
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [promptFile, setPromptFile] = useState<File | null>(null)
  const [cloneVoiceId, setCloneVoiceId] = useState('')
  const [cloneText, setCloneText] = useState('大兄弟，听您口音不是本地人吧，头回来天津卫，啊，待会您可甭跟着导航走，那玩意儿净给您往大马路上绕。')
  const [promptText, setPromptText] = useState('后来认为啊，是有人抓这鸡，可是抓鸡的地方呢没人听过鸡叫。')
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneFileId, setCloneFileId] = useState('')
  const [promptFileId, setPromptFileId] = useState('')
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null)
  const cloneAudioRef = useRef<HTMLAudioElement>(null)

  // 异步处理文件选择，避免阻塞主线程
  const handleCloneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 立即保存文件引用，不做任何其他操作
    setCloneFile(file)
    
    // 使用 requestIdleCallback 在浏览器空闲时记录日志
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        onLog(`已选择克隆音频: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      })
    } else {
      setTimeout(() => {
        onLog(`已选择克隆音频: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }, 100)
    }
  }

  const handlePromptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 立即保存文件引用，不做任何其他操作
    setPromptFile(file)
    
    // 使用 requestIdleCallback 在浏览器空闲时记录日志
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        onLog(`已选择示例音频: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      })
    } else {
      setTimeout(() => {
        onLog(`已选择示例音频: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }, 100)
    }
  }

  // 上传克隆音频 - 使用 setTimeout 解耦主线程，防止浏览器卡死
  const handleUploadCloneFile = () => {
    if (!cloneFile) {
      onError('请选择待克隆音频')
      return
    }

    const fileSizeMB = cloneFile.size / 1024 / 1024
    if (fileSizeMB > 20) {
      onError(`文件过大 (${fileSizeMB.toFixed(1)}MB)，最大支持 20MB`)
      return
    }

    // 立即设置加载状态，防止重复点击
    setCloneLoading(true)
    onError('')
    
    // 使用 requestAnimationFrame 确保 UI 更新后再开始上传
    requestAnimationFrame(() => {
      onLog(`开始上传克隆音频: ${cloneFile.name} (${fileSizeMB.toFixed(1)}MB)`)
      
      // 退出当前渲染循环，给浏览器喘息机会
      setTimeout(async () => {
      try {
        const formData = new FormData()
        formData.append('file', cloneFile)
        formData.append('purpose', 'voice_clone')
        if (customApiKey) formData.append('api_key', customApiKey)
        if (customGroupId) formData.append('group_id', customGroupId)

        onLog('正在上传到服务器...')
        const res = await fetch('/api/minimax/voice-clone/upload', {
          method: 'POST',
          body: formData,
        })

        onLog(`服务器响应: ${res.status}`)
        const data = await res.json()

        if (data.success && data.data?.file_id) {
          setCloneFileId(data.data.file_id)
          onLog(`克隆音频上传成功: file_id=${data.data.file_id}`)
        } else {
          onError(data.error || '上传失败')
          onLog(`错误: ${data.error}`)
        }
      } catch (e: any) {
        onError(e.message || '上传失败')
        onLog(`异常: ${e.message}`)
      } finally {
        setCloneLoading(false)
      }
    }, 0)
  }

  // 上传示例音频 - 使用 setTimeout 解耦主线程
  const handleUploadPromptFile = () => {
    if (!promptFile) {
      onError('请选择示例音频')
      return
    }

    const fileSizeMB = promptFile.size / 1024 / 1024
    if (fileSizeMB > 20) {
      onError(`文件过大 (${fileSizeMB.toFixed(1)}MB)，最大支持 20MB`)
      return
    }

    // 立即设置加载状态，防止重复点击
    setCloneLoading(true)
    onError('')
    
    // 使用 requestAnimationFrame 确保 UI 更新后再开始上传
    requestAnimationFrame(() => {
      onLog(`开始上传示例音频: ${promptFile.name} (${fileSizeMB.toFixed(1)}MB)`)
      
      setTimeout(async () => {
      try {
        const formData = new FormData()
        formData.append('file', promptFile)
        formData.append('purpose', 'prompt_audio')
        if (customApiKey) formData.append('api_key', customApiKey)
        if (customGroupId) formData.append('group_id', customGroupId)

        onLog('正在上传到服务器...')
        const res = await fetch('/api/minimax/voice-clone/upload', {
          method: 'POST',
          body: formData,
        })

        onLog(`服务器响应: ${res.status}`)
        const data = await res.json()

        if (data.success && data.data?.file_id) {
          setPromptFileId(data.data.file_id)
          onLog(`示例音频上传成功: file_id=${data.data.file_id}`)
        } else {
        onError(data.error || '上传失败')
        onLog(`错误: ${data.error}`)
      }
    } catch (e: any) {
      onError(e.message || '上传失败')
      onLog(`异常: ${e.message}`)
    } finally {
      setCloneLoading(false)
    }
      }, 0)
    })
  }

  const handleVoiceClone = async () => {
    if (!cloneFileId) {
      onError('请先上传克隆音频')
      return
    }
    if (!cloneVoiceId) {
      onError('请输入自定义 Voice ID')
      return
    }
    if (!cloneText) {
      onError('请输入测试文本')
      return
    }

    setCloneLoading(true)
    onLog(`开始声音克隆: voice_id=${cloneVoiceId}`)

    try {
      const requestBody: any = {
        file_id: cloneFileId,
        voice_id: cloneVoiceId,
        text: cloneText,
        model: model || 'speech-2.8-hd',
      }

      if (promptFileId && promptText) {
        requestBody.clone_prompt = {
          prompt_audio: promptFileId,
          prompt_text: promptText,
        }
      }

      if (customApiKey) requestBody.api_key = customApiKey
      if (customGroupId) requestBody.group_id = customGroupId

      const res = await fetch('/api/minimax/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      onLog(`克隆响应: ${JSON.stringify(data)}`)

      if (data.success && data.data?.audio) {
        const base64Audio = data.data.audio
        const audioData = atob(base64Audio)
        const arrayBuffer = new Uint8Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) {
          arrayBuffer[i] = audioData.charCodeAt(i)
        }
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        setCloneAudioUrl(url)
        onLog(`声音克隆成功！现在可以使用 voice_id: ${cloneVoiceId}`)
      } else {
        onError(data.error || '克隆失败')
        onLog(`错误: ${data.error}`)
      }
    } catch (e: any) {
      onError(e.message || '克隆失败')
      onLog(`异常: ${e.message}`)
    } finally {
      setCloneLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>声音克隆</CardTitle>
        <CardDescription>
          上传音频文件克隆声音，生成自定义 Voice ID 用于后续语音合成
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 步骤1: 上传克隆音频 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>1. 上传待克隆音频（必填）</Label>
            {cloneFileId && <Badge variant="secondary">已上传</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            支持 mp3、m4a、wav 格式，时长 10秒-5分钟，最大 20MB
          </p>
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".mp3,.m4a,.wav"
              onChange={handleCloneFileChange}
              className="flex-1"
              disabled={cloneLoading}
            />
            <Button
              onClick={handleUploadCloneFile}
              disabled={cloneLoading || !cloneFile}
              variant="outline"
            >
              {cloneLoading ? '上传中...' : '上传'}
            </Button>
          </div>
          {cloneFile && !cloneFileId && (
            <p className="text-xs text-muted-foreground">
              已选择: {cloneFile.name} ({(cloneFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {cloneFileId && (
            <p className="text-xs text-muted-foreground">
              file_id: <code className="rounded bg-muted px-1">{cloneFileId}</code>
            </p>
          )}
        </div>

        {/* 步骤2: 上传示例音频 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>2. 上传示例音频（可选）</Label>
            {promptFileId && <Badge variant="secondary">已上传</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            支持 mp3、m4a、wav 格式，时长小于 8秒，最大 20MB
          </p>
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".mp3,.m4a,.wav"
              onChange={handlePromptFileChange}
              className="flex-1"
              disabled={cloneLoading}
            />
            <Button
              onClick={handleUploadPromptFile}
              disabled={cloneLoading || !promptFile}
              variant="outline"
            >
              {cloneLoading ? '上传中...' : '上传'}
            </Button>
          </div>
          {promptFile && !promptFileId && (
            <p className="text-xs text-muted-foreground">
              已选择: {promptFile.name} ({(promptFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {promptFileId && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                file_id: <code className="rounded bg-muted px-1">{promptFileId}</code>
              </p>
              <div className="space-y-2">
                <Label>示例文本</Label>
                <Input
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="输入示例音频对应的文本"
                />
              </div>
            </div>
          )}
        </div>

        {/* 步骤3: 配置克隆参数 */}
        <div className="space-y-3">
          <Label>3. 配置克隆参数</Label>
          <div className="space-y-2">
            <Label htmlFor="clone-voice-id">自定义 Voice ID（必填）</Label>
            <Input
              id="clone-voice-id"
              value={cloneVoiceId}
              onChange={(e) => setCloneVoiceId(e.target.value)}
              placeholder="例如: my-custom-voice-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clone-text">测试文本（必填）</Label>
            <Textarea
              id="clone-text"
              value={cloneText}
              onChange={(e) => setCloneText(e.target.value)}
              placeholder="输入用于克隆测试的文本"
              rows={3}
            />
          </div>
        </div>

        {/* 步骤4: 开始克隆 */}
        <Button
          onClick={handleVoiceClone}
          disabled={cloneLoading || !cloneFileId || !cloneVoiceId || !cloneText}
          className="w-full"
        >
          {cloneLoading ? '克隆中...' : '4. 开始克隆'}
        </Button>

        {/* 克隆结果 */}
        {cloneAudioUrl && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium text-green-600">
              ✓ 克隆成功！Voice ID: {cloneVoiceId}
            </p>
            <p className="text-xs text-muted-foreground">
              现在可以在上面的语音合成中使用这个 Voice ID
            </p>
            <Label>试听克隆音频：</Label>
            <audio
              ref={cloneAudioRef}
              controls
              src={cloneAudioUrl}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
