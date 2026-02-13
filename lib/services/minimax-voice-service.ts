import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'

/**
 * MiniMax 语音服务
 * 
 * 功能：
 * 1. 声音克隆 (Voice Clone)
 * 2. 文本转语音 (TTS / T2A)
 * 3. 自动故障转移（主力/备用配置切换）
 */

interface VoiceConfig {
  id: string
  provider: string
  apiKey: string
  groupId?: string
  endpoint: string
  enabled: boolean
  priority: number
}

interface CloneVoiceRequest {
  file: File
  voiceId: string
  voiceName: string
  needNoiseReduction?: boolean
  needVolumeNormalization?: boolean
}

interface TextToSpeechRequest {
  text: string
  voiceId: string
  model?: string
  speed?: number
  volume?: number
  pitch?: number
}

interface VoiceResponse {
  success: boolean
  data?: any
  error?: string
  provider?: string
}

export class MinimaxVoiceService {
  private configs: VoiceConfig[] = []

  constructor(configs: VoiceConfig[]) {
    this.configs = configs.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 声音克隆（带自动故障转移）
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<VoiceResponse> {
    for (const config of this.configs) {
      try {
        console.log(`[v0] 尝试使用 ${config.provider} 克隆声音`)

        const result = await this.cloneVoiceWithConfig(request, config)

        await this.updateConfigStats(config.id, true)

        console.log(`[v0] 声音克隆成功: ${request.voiceId}`)
        return {
          success: true,
          data: result,
          provider: config.provider,
        }
      } catch (error) {
        console.error(`[v0] ${config.provider} 失败:`, error)

        await this.updateConfigStats(
          config.id,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        )

        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : '声音克隆失败',
          }
        }

        console.log('[v0] 尝试下一个配置...')
      }
    }

    return {
      success: false,
      error: '没有可用的配置',
    }
  }

  /**
   * 使用指定配置克隆声音
   */
  private async cloneVoiceWithConfig(
    request: CloneVoiceRequest,
    config: VoiceConfig
  ): Promise<any> {
    // Step 1: 上传文件
    const formData = new FormData()
    formData.append('purpose', 'voice_clone')
    formData.append('file', request.file)

    const uploadUrl = config.groupId
      ? `${config.endpoint}/v1/files/upload?GroupId=${config.groupId}`
      : `${config.endpoint}/v1/files/upload`

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`文件上传失败: ${error}`)
    }

    const uploadData = await uploadResponse.json()
    const fileId = uploadData.file?.file_id

    if (!fileId) {
      throw new Error('未获取到 file_id')
    }

    // Step 2: 克隆声音
    const cloneUrl = config.groupId
      ? `${config.endpoint}/v1/voice_clone?GroupId=${config.groupId}`
      : `${config.endpoint}/v1/voice_clone`

    const cloneResponse = await fetch(cloneUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        voice_id: request.voiceId,
        need_noise_reduction: request.needNoiseReduction || false,
        need_volume_normalization: request.needVolumeNormalization || false,
      }),
    })

    if (!cloneResponse.ok) {
      const error = await cloneResponse.text()
      throw new Error(`声音克隆失败: ${error}`)
    }

    const cloneData = await cloneResponse.json()

    if (cloneData.base_resp?.status_code === 1008) {
      throw new Error('账户余额不足，请充值')
    }

    if (cloneData.base_resp?.status_code !== 0) {
      throw new Error(
        cloneData.base_resp?.status_msg || '声音克隆失败'
      )
    }

    // 上传 demo 音频到 Blob（如果有）
    let demoAudioUrl: string | null = null
    if (cloneData.demo_audio) {
      const audioBuffer = Buffer.from(cloneData.demo_audio, 'base64')
      const blob = await put(
        `minimax/demo/${request.voiceId}.mp3`,
        audioBuffer,
        {
          access: 'public',
          contentType: 'audio/mpeg',
        }
      )
      demoAudioUrl = blob.url
    }

    return {
      voiceId: request.voiceId,
      voiceName: request.voiceName,
      fileId,
      demoAudioUrl,
    }
  }

  /**
   * 文本转语音（带自动故障转移）
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<VoiceResponse> {
    for (const config of this.configs) {
      try {
        console.log(`[v0] 尝试使用 ${config.provider} 进行 TTS`)

        const result = await this.textToSpeechWithConfig(request, config)

        await this.updateConfigStats(config.id, true)

        console.log(`[v0] TTS 生成成功`)
        return {
          success: true,
          data: result,
          provider: config.provider,
        }
      } catch (error) {
        console.error(`[v0] ${config.provider} 失败:`, error)

        await this.updateConfigStats(
          config.id,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        )

        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'TTS 生成失败',
          }
        }

        console.log('[v0] 尝试下一个配置...')
      }
    }

    return {
      success: false,
      error: '没有可用的配置',
    }
  }

  /**
   * 使用指定配置进行TTS
   */
  private async textToSpeechWithConfig(
    request: TextToSpeechRequest,
    config: VoiceConfig
  ): Promise<any> {
    const ttsUrl = config.groupId
      ? `${config.endpoint}/v1/t2a_v2?GroupId=${config.groupId}`
      : `${config.endpoint}/v1/t2a_v2`

    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'speech-2.6-hd',
        text: request.text,
        stream: false,
        voice_setting: {
          voice_id: request.voiceId,
          speed: request.speed || 1.0,
          vol: request.volume || 1.0,
          pitch: request.pitch || 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
        output_format: 'hex',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TTS 请求失败: ${error}`)
    }

    const data = await response.json()

    if (data.base_resp?.status_code === 1008) {
      throw new Error('账户余额不足，请充值')
    }

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || 'TTS 生成失败')
    }

    // 转换音频数据并上传到 Blob
    if (!data.data?.audio) {
      throw new Error('未能获取音频数据')
    }

    const audioHex = data.data.audio
    const audioBuffer = Buffer.from(audioHex, 'hex')

    // 上传到 Vercel Blob
    const timestamp = Date.now()
    const blob = await put(
      `minimax/tts/${request.voiceId}-${timestamp}.mp3`,
      audioBuffer,
      {
        access: 'public',
        contentType: 'audio/mpeg',
      }
    )

    return {
      audioUrl: blob.url,
      duration: data.extra_info?.audio_length / 1000, // 转换为秒
      subtitles: data.data?.subtitles,
    }
  }

  /**
   * 更新配置统计
   */
  private async updateConfigStats(
    configId: string,
    success: boolean,
    errorMsg?: string
  ) {
    try {
      const supabase = await createClient()

      const { data: config } = await supabase
        .from('minimax_voice_configs')
        .select('total_requests, success_requests, failed_requests')
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('minimax_voice_configs')
          .update({
            total_requests: config.total_requests + 1,
            success_requests: success
              ? config.success_requests + 1
              : config.success_requests,
            failed_requests: !success
              ? config.failed_requests + 1
              : config.failed_requests,
            last_used_at: new Date().toISOString(),
            ...(errorMsg && { last_error: errorMsg }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[v0] 更新统计失败:', error)
    }
  }
}

/**
 * 获取 MiniMax 服务实例（自动加载激活的配置）
 */
export async function getMinimaxService(): Promise<MinimaxVoiceService> {
  const supabase = await createClient()

  console.log('[v0] Fetching MiniMax configs...')

  const { data: configs, error } = await supabase
    .from('minimax_voice_configs')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true })

  console.log('[v0] Configs query:', { hasConfigs: !!configs, count: configs?.length, error })

  if (error) {
    console.error('[v0] Config query error:', error)
    throw new Error(`查询配置失败: ${error.message}`)
  }

  if (!configs || configs.length === 0) {
    throw new Error('没有可用的 MiniMax 配置，请先在管理后台添加配置')
  }

  const serviceConfigs = configs.map((c) => ({
    id: c.id,
    provider: c.provider,
    apiKey: c.api_key,
    groupId: c.group_id,
    endpoint: 'https://api.minimaxi.com', // 固定使用官方端点
    enabled: c.enabled,
    priority: c.priority,
  }))

  console.log('[v0] Service configs:', serviceConfigs.length)

  return new MinimaxVoiceService(serviceConfigs)
}
