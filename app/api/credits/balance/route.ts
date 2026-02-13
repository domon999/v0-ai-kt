import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    // Get user credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('[v0] Get balance error:', error)
      // If user doesn't have credits record, return 0
      if (error.code === 'PGRST116') {
        return ApiResponseHelper.success({ credits: 0 })
      }
      throw error
    }

    return ApiResponseHelper.success({
      credits: Number(data.credits || 0),
    })
  } catch (error) {
    console.error('[v0] Balance API error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '获取积分余额失败'
    )
  }
}
