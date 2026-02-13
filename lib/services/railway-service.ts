import { createClient } from '@/lib/supabase/server'

/**
 * Railway VEO 3.1 视频生成服务
 * 
 * 功能：
 * 1. 图片生成 16 秒视频
 * 2. 视频延长 16 秒（16秒 -> 32秒）
 * 3. 自动故障转移（主力/备用配置切换）
 * 4. 任务轮询和状态追踪
 */

interface RailwayConfig {
  id: string
  config_name: string
  api_base_url: string
  api_key: string
  is_active: boolean
  priority: number
}

interface GenerateVideoParams {
  imageUrl: string
  prompt: string
}

interface ExtendVideoParams {
  videoUrl: string
  prompt: string
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl: string | null
  error: string | null
  progress?: number
}

export class RailwayService {
  private configs: RailwayConfig[] = []

  constructor(configs: RailwayConfig[]) {
    // 按优先级排序（数字越小优先级越高）
    this.configs = configs.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 生成视频（图片 -> 16秒视频）
   */
  async generateVideo(params: GenerateVideoParams): Promise<{
    success: boolean
    taskId?: string
    error?: string
    provider?: string
    configName?: string
  }> {
    const { imageUrl, prompt } = params

    // 尝试所有配置直到成功
    for (const config of this.configs) {
      try {
        console.log(`[Railway] 尝试使用配置: ${config.config_name}`)

        const response = await fetch(`${config.api_base_url}/api/video/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl,
            prompt,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!data.success || !data.taskId) {
          throw new Error(data.error || '未返回任务ID')
        }

        // 记录成功
        await this.recordSuccess(config.id)

        console.log(`[Railway] 视频生成任务创建成功: ${data.taskId}`)
        return {
          success: true,
          taskId: data.taskId,
          provider: 'Railway VEO 3.1',
          configName: config.config_name,
        }
      } catch (error) {
        console.error(`[Railway] 配置 ${config.config_name} 失败:`, error)
        
        // 记录失败
        await this.recordFailure(config.id)

        // 如果是最后一个配置，返回错误
        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : '视频生成失败',
          }
        }

        // 否则继续尝试下一个配置
        console.log('[Railway] 尝试下一个配置...')
      }
    }

    return {
      success: false,
      error: '所有配置都失败',
    }
  }

  /**
   * 延长视频（16秒 -> 32秒）
   */
  async extendVideo(params: ExtendVideoParams): Promise<{
    success: boolean
    taskId?: string
    error?: string
    provider?: string
    configName?: string
  }> {
    const { videoUrl, prompt } = params

    // 尝试所有配置直到成功
    for (const config of this.configs) {
      try {
        console.log(`[Railway] 尝试使用配置延长视频: ${config.config_name}`)

        const response = await fetch(`${config.api_base_url}/api/video/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: videoUrl, // 使用视频URL作为起始
            prompt,
            isExtension: true,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!data.success || !data.taskId) {
          throw new Error(data.error || '未返回任务ID')
        }

        // 记录成功
        await this.recordSuccess(config.id)

        console.log(`[Railway] 视频延长任务创建成功: ${data.taskId}`)
        return {
          success: true,
          taskId: data.taskId,
          provider: 'Railway VEO 3.1',
          configName: config.config_name,
        }
      } catch (error) {
        console.error(`[Railway] 配置 ${config.config_name} 失败:`, error)
        
        // 记录失败
        await this.recordFailure(config.id)

        // 如果是最后一个配置，返回错误
        if (config === this.configs[this.configs.length - 1]) {
          return {
            success: false,
            error: error instanceof Error ? error.message : '视频延长失败',
          }
        }

        // 否则继续尝试下一个配置
        console.log('[Railway] 尝试下一个配置...')
      }
    }

    return {
      success: false,
      error: '所有配置都失败',
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    // 尝试所有配置查询状态
    for (const config of this.configs) {
      try {
        const response = await fetch(
          `${config.api_base_url}/api/video/status/${taskId}`
        )

        if (!response.ok) {
          continue // 尝试下一个配置
        }

        const data = await response.json()

        if (!data.success) {
          continue
        }

        return {
          status: data.data.status,
          videoUrl: data.data.videoUrl,
          error: data.data.error,
          progress: data.data.currentStep ? 
            Math.round((data.data.currentStep / 15) * 100) : undefined,
        }
      } catch (error) {
        console.error(`[Railway] 查询状态失败 (${config.config_name}):`, error)
        continue
      }
    }

    return {
      status: 'failed',
      videoUrl: null,
      error: '无法查询任务状态',
    }
  }

  /**
   * 记录成功
   */
  private async recordSuccess(configId: string) {
    try {
      const supabase = await createClient()
      const { data: config } = await supabase
        .from('railway_config')
        .select('success_count')
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('railway_config')
          .update({
            success_count: config.success_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[Railway] 记录成功失败:', error)
    }
  }

  /**
   * 记录失败
   */
  private async recordFailure(configId: string) {
    try {
      const supabase = await createClient()
      const { data: config } = await supabase
        .from('railway_config')
        .select('fail_count')
        .eq('id', configId)
        .single()

      if (config) {
        await supabase
          .from('railway_config')
          .update({
            fail_count: config.fail_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configId)
      }
    } catch (error) {
      console.error('[Railway] 记录失败失败:', error)
    }
  }
}

/**
 * 获取 Railway 服务实例（自动加载激活的配置）
 */
export async function getRailwayService(): Promise<RailwayService> {
  const supabase = await createClient()

  const { data: configs, error } = await supabase
    .from('railway_config')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })

  if (error || !configs || configs.length === 0) {
    throw new Error('没有可用的 Railway 配置')
  }

  return new RailwayService(configs)
}
