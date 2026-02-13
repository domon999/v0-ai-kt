import { createClient } from '@/lib/supabase/server'

export interface DeductCreditsParams {
  userId: string
  amount: number
  type: 'digital_human' | 'video_generation' | 'video_extend' | 'voice_clone' | 'tts' | 'lip_sync' | 'synthesis' | 'other'
  description: string
  metadata?: Record<string, any>
}

export interface DeductCreditsResult {
  success: boolean
  newBalance?: number
  error?: string
}

export class CreditService {
  /**
   * 扣减用户积分并记录流水
   */
  static async deductCredits(params: DeductCreditsParams): Promise<DeductCreditsResult> {
    const supabase = await createClient()

    try {
      // 调用数据库函数处理积分扣减
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        p_user_id: params.userId,
        p_amount: params.amount,
        p_type: params.type,
        p_description: params.description,
        p_metadata: params.metadata || null,
      })

      if (error) {
        console.error('[v0] Credit deduction error:', error)
        return { success: false, error: error.message }
      }

      if (!data || !data.success) {
        return { success: false, error: data?.error || '积分扣减失败' }
      }

      return {
        success: true,
        newBalance: data.new_balance,
      }
    } catch (error) {
      console.error('[v0] Credit service error:', error)
      return { success: false, error: '系统错误，请稍后重试' }
    }
  }

  /**
   * 检查用户积分是否充足
   */
  static async checkCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return false
      }

      return Number(data.credits) >= requiredAmount
    } catch (error) {
      console.error('[v0] Check credits error:', error)
      return false
    }
  }

  /**
   * 获取用户当前积分
   */
  static async getUserCredits(userId: string): Promise<number> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return 0
      }

      return Number(data.credits) || 0
    } catch (error) {
      console.error('[v0] Get user credits error:', error)
      return 0
    }
  }
}
