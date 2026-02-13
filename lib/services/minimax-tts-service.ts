import { createClient } from '@/lib/supabase/server'

/**
 * MiniMax 语音合成服务
 * 官方文档: https://platform.minimaxi.com/document/T2A%20V2
 */

interface MinimaxConfig {
  id: string
  provider: string
  apiKey: string
  groupId?: string
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
    duration: number
    subtitles?: any[]
  }
  error?: string
  provider?: string
}

export class MinimaxTTSService {
  private configs: MinimaxConfig[]

  constructor(configs: MinimaxConfig[]) {
    this.configs = configs.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 同步语音合成（HTTP）
   */
  async textToSpeech(params: TTSParams): Promise<TTSResult> {
    const { text, voiceId, model, speed, volume, pitch } = params

    // 尝试所有配置直到成功
    for (const config of this.configs) {
      try {
        console.log(`[MiniMax] 尝试配置: ${config.provider}`)

        const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'speech-2.8-hd',
            text,
            stream: false,
            voice_setting: {
              voice_id: voiceId,
              speed: speed || 1.0,
              vol: volume || 1.0,
              pitch: pitch || 0,
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: 'mp3',
              channel: 1,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.base_resp?.status_msg || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // MiniMax返回base64编码的音频
        if (!data.data || !data.data.audio) {
          throw new Error('响应中缺少音频数据')
        }

        // 将base64音频转换为Blob并上传到存储
        const audioBase64 = data.data.audio
        const audioBuffer = Buffer.from(audioBase64, 'base64')
        
        // 上传到Vercel Blob
        const audioUrl = await this.uploadAudio(audioBuffer, config.provider)

        await this.recordSuccess(config.id)

        return {
          success: true,
          data: {
            audioUrl,
            duration: data.data.audio_time || 0,
            subtitles: data.data.subtitles || [],
          },
          provider: config.provider,
        }
      } catch (error) {
        console.error(`[MiniMax] 配置 ${config.provider} 失败:`, error)
        await this.recordFailure(config.id)

        // 如果是最后一个配置，返回错误
        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'TTS 合成失败',
          }
        }
      }
    }

    return {
      success: false,
      error: '所有配置都失败',
    }
  }

  /**
   * 上传音频到 Vercel Blob
   */
  private async uploadAudio(audioBuffer: Buffer, provider: string): Promise<string> {
    const { put } = await import('@vercel/blob')
    
    const filename = `minimax-tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`
    
    const blob = await put(filename, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
    })

    return blob.url
  }

  /**
   * 记录成功
   */
  private async recordSuccess(configId: string) {
    try {
      const supabase = await createClient()
      const { data: config } = await supabase
        .from('minimax_voice_configs')
        .select('success_requests')
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('minimax_voice_configs')
          .update({
            success_requests: config.success_requests + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[MiniMax] 记录成功失败:', error)
    }
  }

  /**
   * 记录失败
   */
  private async recordFailure(configId: string) {
    try {
      const supabase = await createClient()
      const { data: config } = await supabase
        .from('minimax_voice_configs')
        .select('failed_requests')
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('minimax_voice_configs')
          .update({
            failed_requests: config.failed_requests + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[MiniMax] 记录失败失败:', error)
    }
  }
}

/**
 * 获取 MiniMax 服务实例
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
    throw new Error('没有可用的 MiniMax 配置，请先在管理后台添加配置')
  }

  return new MinimaxTTSService(configs)
}
