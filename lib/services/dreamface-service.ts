import { createClient } from '@/lib/supabase/server'

export class DreamFaceService {
  private static tokenIndex = 0

  static async syncLips(videoUrl: string, audioUrl: string): Promise<{ taskId: string; config: any }> {
    const supabase = await createClient()
    
    const { data: configs } = await supabase
      .from('dreamface_config')
      .select('*')
      .eq('is_active', true)
      .order('priority')
    
    if (!configs || configs.length === 0) {
      throw new Error('No active DreamFace config found')
    }

    for (const config of configs) {
      if (!config.tokens || config.tokens.length === 0) {
        continue
      }

      const token = this.getNextToken(config.tokens)
      
      try {
        const response = await fetch(`${config.api_base_url}/api/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            video_url: videoUrl,
            audio_url: audioUrl,
          }),
        })

        if (!response.ok) {
          throw new Error(`DreamFace API error: ${response.statusText}`)
        }

        const result = await response.json()
        
        await supabase.rpc('increment_dreamface_stats', {
          config_id: config.id,
          is_success: true,
        })

        return { taskId: result.task_id, config }
      } catch (error: any) {
        await supabase.rpc('increment_dreamface_stats', {
          config_id: config.id,
          is_success: false,
          error_msg: error.message,
        })
        
        continue
      }
    }

    throw new Error('All DreamFace configs failed')
  }

  static async queryTask(taskId: string, configId: string): Promise<any> {
    const supabase = await createClient()
    
    const { data: config } = await supabase
      .from('dreamface_config')
      .select('*')
      .eq('id', configId)
      .single()

    if (!config || !config.tokens || config.tokens.length === 0) {
      throw new Error('DreamFace config not found or no tokens')
    }

    const token = this.getNextToken(config.tokens)

    const response = await fetch(`${config.api_base_url}/api/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`DreamFace query error: ${response.statusText}`)
    }

    return response.json()
  }

  private static getNextToken(tokens: string[]): string {
    const token = tokens[this.tokenIndex % tokens.length]
    this.tokenIndex++
    return token
  }
}

export async function incrementDreamFaceStats(configId: string, isSuccess: boolean, errorMsg?: string) {
  const supabase = await createClient()
  
  await supabase.rpc('increment_dreamface_stats', {
    config_id: configId,
    is_success: isSuccess,
    error_msg: errorMsg || null,
  })
}
