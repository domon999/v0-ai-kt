import { createClient } from '@/lib/supabase/server'

type MinimaxConfig = {
  id: string
  config_name: string
  api_key: string
  group_id: string
  base_url: string
  is_active: boolean
  priority: number
}

export class MinimaxService {
  private async getActiveConfigs(): Promise<MinimaxConfig[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('minimax_voice_configs')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) throw new Error(`获取 MiniMax 配置失败: ${error.message}`)
    if (!data || data.length === 0) {
      throw new Error('服务未配置，请先在管理后台配置 MiniMax API')
    }

    return data
  }

  async cloneVoice(audioFile: File | Buffer, voiceName: string): Promise<{
    success: boolean
    voiceId?: string
    error?: string
    configName?: string
  }> {
    const configs = await this.getActiveConfigs()

    for (const config of configs) {
      try {
        const formData = new FormData()
        if (audioFile instanceof Buffer) {
          formData.append('audio', new Blob([audioFile]), 'audio.wav')
        } else {
          formData.append('audio', audioFile)
        }
        formData.append('voice_name', voiceName)

        const response = await fetch(`${config.base_url}/v1/voice_cloning`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            'X-Group-Id': config.group_id,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`MiniMax API 错误: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        await this.updateStats(config.id, true)

        return {
          success: true,
          voiceId: result.voice_id,
          configName: config.config_name,
        }
      } catch (error: any) {
        console.error(`[v0] MiniMax config ${config.config_name} failed:`, error)
        await this.updateStats(config.id, false, error.message)
        continue
      }
    }

    return {
      success: false,
      error: '所有 MiniMax API 接口都失败了',
    }
  }

  async textToSpeech(
    text: string,
    voiceId: string,
  ): Promise<{
    success: boolean
    audioUrl?: string
    audioBuffer?: ArrayBuffer
    error?: string
    configName?: string
  }> {
    const configs = await this.getActiveConfigs()

    for (const config of configs) {
      try {
        const response = await fetch(`${config.base_url}/v1/text_to_speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.api_key}`,
            'X-Group-Id': config.group_id,
          },
          body: JSON.stringify({
            text,
            voice_id: voiceId,
            model: 'speech-01',
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`MiniMax TTS 错误: ${response.status} ${errorText}`)
        }

        const audioBuffer = await response.arrayBuffer()
        await this.updateStats(config.id, true)

        return {
          success: true,
          audioBuffer,
          configName: config.config_name,
        }
      } catch (error: any) {
        console.error(`[v0] MiniMax TTS config ${config.config_name} failed:`, error)
        await this.updateStats(config.id, false, error.message)
        continue
      }
    }

    return {
      success: false,
      error: '所有 MiniMax TTS 接口都失败了',
    }
  }

  calculateTTSCredits(textLength: number): number {
    return Math.ceil(textLength / 100) * 10
  }

  private async updateStats(configId: string, isSuccess: boolean, errorMsg?: string) {
    const supabase = await createClient()
    await supabase.rpc('increment_minimax_stats', {
      config_id: configId,
      is_success: isSuccess,
      error_msg: errorMsg || null,
    })
  }
}

export function getMinimaxService() {
  return new MinimaxService()
}
