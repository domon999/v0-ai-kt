import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'

interface BananaConfig {
  id: string
  config_name: string
  api_key: string
  base_url: string
  model_key: string
  is_active: boolean
  priority: number
  total_requests: number
  success_count: number
  error_count: number
}

interface GenerateRequest {
  prompt?: string
  image?: string // Base64
  backgroundImage?: string // Base64
  imageUrl?: string // URL
  backgroundImageUrl?: string // URL
}

interface GenerateResponse {
  success: boolean
  content?: string
  imageUrls?: string[]
  error?: string
  provider?: string
  configName?: string
}

export class BananaService {
  private configs: BananaConfig[] = []

  /**
   * 初始化：加载所有活跃的配置，按优先级排序
   */
  async initialize() {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('banana_config')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('[v0] [BananaService] Failed to load configs:', error)
      throw new Error('Failed to load Banana API configurations')
    }

    // 过滤出有 API Key 的配置
    this.configs = (data || []).filter(
      (config) => config.api_key && config.api_key.trim() !== ''
    )

    if (this.configs.length === 0) {
      throw new Error(
        'No active Banana API configuration found. Please configure at /glht/api'
      )
    }

    console.log(
      '[v0] [BananaService] Loaded configs:',
      this.configs.map((c) => ({
        name: c.config_name,
        priority: c.priority,
        url: c.base_url,
      }))
    )
  }

  /**
   * 生成图片 - 自动故障转移
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (this.configs.length === 0) {
      await this.initialize()
    }

    const errors: string[] = []

    // 按优先级依次尝试
    for (const config of this.configs) {
      try {
        console.log(
          `[v0] [BananaService] Trying ${config.config_name} (priority ${config.priority})`
        )

        const result = await this.generateWithConfig(request, config)

        // 成功：更新统计
        await this.updateStats(config.id, true)

        return {
          success: true,
          content: result.content,
          imageUrls: result.imageUrls,
          provider: 'banana',
          configName: config.config_name,
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error'
        console.error(
          `[v0] [BananaService] ${config.config_name} failed:`,
          errorMsg
        )

        errors.push(`${config.config_name}: ${errorMsg}`)

        // 失败：更新统计
        await this.updateStats(config.id, false, errorMsg)

        // 继续尝试下一个配置
        continue
      }
    }

    // 所有配置都失败
    const finalError = `所有 Banana API 接口都失败了:\n${errors.join('\n')}`
    console.error('[v0] [BananaService]', finalError)

    return {
      success: false,
      error: finalError,
    }
  }

  /**
   * 使用特定配置生成图片
   */
  private async generateWithConfig(
    request: GenerateRequest,
    config: BananaConfig
  ): Promise<{ content: string; imageUrls: string[] }> {
    const { prompt, image, backgroundImage, imageUrl, backgroundImageUrl } =
      request

    // 构建消息内容
    const messages: any[] = []

    if ((image || imageUrl) && (backgroundImage || backgroundImageUrl)) {
      // 双图合成模式
      const content: any[] = [
        {
          type: 'text',
          text:
            prompt ||
            '将第一张图片中的人物合成到第二张背景图片中，人物双手微微抬起，正准备说话的样子，保持自然姿态。请生成高质量的合成图片。',
        },
      ]

      // 第一张图（自拍照）
      if (imageUrl) {
        content.push({ type: 'image_url', image_url: { url: imageUrl } })
      } else if (image) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${image}` },
        })
      }

      // 第二张图（背景）
      if (backgroundImageUrl) {
        content.push({
          type: 'image_url',
          image_url: { url: backgroundImageUrl },
        })
      } else if (backgroundImage) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${backgroundImage}` },
        })
      }

      messages.push({ role: 'user', content })
    } else if (image || imageUrl) {
      // 图生图模式
      const content: any[] = [
        {
          type: 'text',
          text: prompt || 'Generate an image based on this reference',
        },
      ]

      if (imageUrl) {
        content.push({ type: 'image_url', image_url: { url: imageUrl } })
      } else if (image) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${image}` },
        })
      }

      messages.push({ role: 'user', content })
    } else if (prompt) {
      // 文生图模式
      messages.push({ role: 'user', content: prompt })
    } else {
      throw new Error('Prompt or image is required')
    }

    // 调用 API
    const requestBody = {
      model: config.model_key,
      messages,
      stream: false,
      max_tokens: 4096,
    }

    console.log(`[v0] [BananaService] Calling ${config.base_url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s 超时

    try {
      const response = await fetch(config.base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${config.api_key}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `API error ${response.status}: ${errorText.substring(0, 200)}`
        )
      }

      const data = await response.json()
      let content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content in API response')
      }

      // 处理 Base64 图片：上传到 Blob
      const imageUrls = await this.processImages(content)

      return { content, imageUrls }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout after 60 seconds')
      }

      throw new Error(`Network error: ${fetchError.message}`)
    }
  }

  /**
   * 处理响应中的图片：提取 URL 并上传 Base64 到 Blob
   */
  private async processImages(content: string): Promise<string[]> {
    const imageUrls: string[] = []

    // 提取所有 Base64 图片并上传
    const base64Regex = /data:image\/([a-zA-Z]*);base64,([^")\s]*)/g
    let match

    while ((match = base64Regex.exec(content)) !== null) {
      const fullMatch = match[0]
      const type = match[1]
      const base64Data = match[2]

      try {
        const buffer = Buffer.from(base64Data, 'base64')
        const filename = `banana-gen-${Date.now()}-${Math.random().toString(36).substring(7)}.${type === 'jpeg' ? 'jpg' : type}`

        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: `image/${type}`,
        })

        imageUrls.push(blob.url)

        // 替换 content 中的 Base64 为 URL
        content = content.replace(fullMatch, blob.url)
      } catch (uploadError) {
        console.error(
          '[v0] [BananaService] Failed to upload image:',
          uploadError
        )
      }
    }

    // 提取 URL 格式的图片
    const urlRegex =
      /(https?:\/\/[^\s<>"{}|\\^`[\]]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi
    while ((match = urlRegex.exec(content)) !== null) {
      if (!imageUrls.includes(match[1])) {
        imageUrls.push(match[1])
      }
    }

    return imageUrls
  }

  /**
   * 更新配置的使用统计
   */
  private async updateStats(
    configId: string,
    success: boolean,
    errorMessage?: string
  ) {
    const supabase = await createClient()

    // 先读取当前统计
    const { data: current } = await supabase
      .from('banana_config')
      .select('total_requests, success_count, error_count')
      .eq('id', configId)
      .single()

    if (current) {
      const updateData: any = {
        total_requests: (current.total_requests || 0) + 1,
        last_request_at: new Date().toISOString(),
      }

      if (success) {
        updateData.success_count = (current.success_count || 0) + 1
      } else {
        updateData.error_count = (current.error_count || 0) + 1
        updateData.last_error_at = new Date().toISOString()
        updateData.last_error_message = errorMessage
      }

      await supabase.from('banana_config').update(updateData).eq('id', configId)
    }
  }
}

// 单例
let bananaServiceInstance: BananaService | null = null

export function getBananaService(): BananaService {
  if (!bananaServiceInstance) {
    bananaServiceInstance = new BananaService()
  }
  return bananaServiceInstance
}
