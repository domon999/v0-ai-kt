import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'

/**
 * MiniMax TTS 服务
 * 基于官方文档实现：https://platform.minimax.io/docs
 */

interface MinimaxConfig {
  id: string
  provider: string
  api_key: string
  group_id?: string
  priority: number
  enabled: boolean
}

interface TTSParams {
  text: string
  voiceId: string
  model?: string
  speed?: number
  volume?: number
  pitch?: number
}

interface TTSResult {
  success: boolean
  data?: {
    audioUrl: string
    duration?: number
    subtitles?: any[]
  }
  error?: string
  provider?: string
}

export class MinimaxTTSService {
  private configs: MinimaxConfig[]
  private apiEndpoint = 'https://api.minimaxi.com/v1/t2a_v2'

  constructor(configs: MinimaxConfig[]) {
    this.configs = configs.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 文本转语音（同步）
   */
  async textToSpeech(params: TTSParams): Promise<TTSResult> {
    const { text, voiceId, model, speed, volume, pitch } = params

    // 尝试所有配置直到成功
    for (const config of this.configs) {
      try {
        console.log('[v0] Trying MiniMax config:', config.provider)

        const requestBody = {
          model: model || 'speech-2.8-hd',
          text,
          voice_id: voiceId,
          speed: speed || 1.0,
          vol: volume || 1.0,
          pitch: pitch || 0,
          ...(config.group_id && { group_id: config.group_id }),
        }

        console.log('[v0] Request body:', { ...requestBody, text: `${text.substring(0, 50)}...` })

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('[v0] Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[v0] MiniMax API error:', errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const contentType = response.headers.get('content-type')
        console.log('[v0] Content-Type:', contentType)

        let audioBuffer: Buffer

        // 处理不同的响应格式
        if (contentType?.includes('application/json')) {
          const jsonData = await response.json()
          console.log('[v0] JSON response:', jsonData)

          if (jsonData.base_resp?.status_code !== 0) {
            throw new Error(jsonData.base_resp?.status_msg || 'API返回错误')
          }

          // 从JSON中获取Base64音频数据
          if (jsonData.data?.audio) {
            audioBuffer = Buffer.from(jsonData.data.audio, 'base64')
          } else if (jsonData.audio) {
            audioBuffer = Buffer.from(jsonData.audio, 'base64')
          } else {
            throw new Error('响应中未找到音频数据')
          }
        } else {
          // 直接返回音频流
          const arrayBuffer = await response.arrayBuffer()
          audioBuffer = Buffer.from(arrayBuffer)
        }

        console.log('[v0] Audio buffer size:', audioBuffer.length)

        // 上传到 Vercel Blob
        const filename = `minimax-tts-${Date.now()}.mp3`
        const blob = await put(filename, audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
        })

        console.log('[v0] Uploaded to Blob:', blob.url)

        // 更新成功统计
        await this.updateStats(config.id, true)

        return {
          success: true,
          data: {
            audioUrl: blob.url,
            duration: undefined,
            subtitles: [],
          },
          provider: config.provider,
        }
      } catch (error) {
        console.error(`[v0] Config ${config.provider} failed:`, error)
        await this.updateStats(config.id, false)

        // 如果是最后一个配置，返回错误
        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'TTS合成失败',
          }
        }

        // 否则尝试下一个配置
        console.log('[v0] Trying next config...')
      }
    }

    return {
      success: false,
      error: '所有配置都失败',
    }
  }

  /**
   * 更新统计信息
   */
  private async updateStats(configId: string, success: boolean) {
    try {
      const supabase = await createClient()
      const field = success ? 'success_requests' : 'failed_requests'

      const { data: config } = await supabase
        .from('minimax_voice_configs')
        .select(field)
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('minimax_voice_configs')
          .update({
            [field]: (config[field] || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[v0] Failed to update stats:', error)
    }
  }
}

/**
 * 获取 MiniMax TTS 服务实例
 */
export async function getMinimaxTTSService(): Promise<MinimaxTTSService> {
  const supabase = await createClient()

  const { data: configs, error } = await supabase
    .from('minimax_voice_configs')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true })

  if (error) {
    throw new Error(`查询配置失败: ${error.message}`)
  }

  if (!configs || configs.length === 0) {
    throw new Error('没有可用的 MiniMax 配置，请先在管理后台 /glht/api 添加 MiniMax 配置')
  }

  return new MinimaxTTSService(configs)
}
