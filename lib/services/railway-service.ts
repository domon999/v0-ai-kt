import { createClient } from '@/lib/supabase/server'

interface RailwayConfig {
  id: string
  api_base_url: string
  priority: number
}

interface GenerateVideoResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url?: string
  error?: string
}

export class RailwayService {
  private static async getActiveConfig(): Promise<RailwayConfig | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('railway_config')
      .select('id, api_base_url, priority')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single()

    return data
  }

  /**
   * 生成16秒视频
   */
  static async generateVideo(imageUrl: string): Promise<{ taskId: string }> {
    const config = await this.getActiveConfig()
    if (!config) {
      throw new Error('No active Railway configuration found')
    }

    try {
      const response = await fetch(`${config.api_base_url}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          duration: 16,
        }),
      })

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.statusText}`)
      }

      const data: GenerateVideoResponse = await response.json()
      
      // 更新统计
      await this.updateStats(config.id, true)

      return { taskId: data.task_id }
    } catch (error) {
      await this.updateStats(config.id, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * 延长视频（16秒 → 32秒）
   */
  static async extendVideo(videoUrl: string): Promise<{ taskId: string }> {
    const config = await this.getActiveConfig()
    if (!config) {
      throw new Error('No active Railway configuration found')
    }

    try {
      const response = await fetch(`${config.api_base_url}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          extend_duration: 16,
        }),
      })

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.statusText}`)
      }

      const data: GenerateVideoResponse = await response.json()
      
      await this.updateStats(config.id, true)

      return { taskId: data.task_id }
    } catch (error) {
      await this.updateStats(config.id, false, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * 查询任务状态
   */
  static async queryTask(taskId: string): Promise<GenerateVideoResponse> {
    const config = await this.getActiveConfig()
    if (!config) {
      throw new Error('No active Railway configuration found')
    }

    const response = await fetch(`${config.api_base_url}/task/${taskId}`)
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.statusText}`)
    }

    return response.json()
  }

  private static async updateStats(configId: string, success: boolean, errorMsg?: string) {
    const supabase = await createClient()
    
    const { data: config } = await supabase
      .from('railway_config')
      .select('total_requests, success_count, error_count')
      .eq('id', configId)
      .single()

    if (config) {
      await supabase
        .from('railway_config')
        .update({
          total_requests: config.total_requests + 1,
          success_count: success ? config.success_count + 1 : config.success_count,
          error_count: !success ? config.error_count + 1 : config.error_count,
          last_request_at: new Date().toISOString(),
          ...(errorMsg && {
            last_error_at: new Date().toISOString(),
            last_error_message: errorMsg,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId)
    }
  }
}
