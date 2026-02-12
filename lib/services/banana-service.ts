import { createClient } from '@/lib/supabase/server'

interface BananaConfig {
  id: string
  config_name: string
  api_key: string
  base_url: string
  model_key: string
  priority: number
}

interface BananaResponse {
  success: boolean
  image_url?: string
  error?: string
}

export class BananaService {
  private async getActiveConfigs(): Promise<BananaConfig[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('banana_config')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error || !data || data.length === 0) {
      throw new Error('No active Banana API configurations found')
    }

    return data as BananaConfig[]
  }

  private async updateStats(
    configId: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const supabase = await createClient()
    const updates: Record<string, any> = {
      total_requests: { increment: 1 },
      last_request_at: new Date().toISOString(),
    }

    if (success) {
      updates.success_count = { increment: 1 }
    } else {
      updates.error_count = { increment: 1 }
      updates.last_error_at = new Date().toISOString()
      updates.last_error_message = errorMessage || 'Unknown error'
    }

    await supabase.rpc('increment_banana_stats', {
      config_id: configId,
      is_success: success,
      error_msg: errorMessage,
    })
  }

  private async callBananaAPI(
    config: BananaConfig,
    imageUrl: string,
    prompt: string,
  ): Promise<string> {
    const response = await fetch(config.base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model_key,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const resultUrl = data?.choices?.[0]?.message?.content

    if (!resultUrl || typeof resultUrl !== 'string') {
      throw new Error('Invalid response format from Banana API')
    }

    return resultUrl
  }

  async generateDigitalHuman(
    imageUrl: string,
    prompt: string = '请将这张图片转换为高质量的数字人形象，保持人物特征和面部细节。',
  ): Promise<BananaResponse> {
    const configs = await this.getActiveConfigs()

    for (const config of configs) {
      try {
        console.log(`[v0] Trying Banana API: ${config.config_name}`)
        const resultUrl = await this.callBananaAPI(config, imageUrl, prompt)

        await this.updateStats(config.id, true)

        return {
          success: true,
          image_url: resultUrl,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(
          `[v0] Banana API ${config.config_name} failed:`,
          errorMessage,
        )

        await this.updateStats(config.id, false, errorMessage)

        if (config === configs[configs.length - 1]) {
          return {
            success: false,
            error: `All Banana API configurations failed. Last error: ${errorMessage}`,
          }
        }
      }
    }

    return {
      success: false,
      error: 'No Banana API configurations available',
    }
  }
}
