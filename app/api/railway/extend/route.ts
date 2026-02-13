import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRailwayService } from '@/lib/services/railway-service'
import { CreditService } from '@/lib/services/credit-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/railway/extend
 * 
 * 视频延长 16 秒（16秒 -> 32秒）
 * 
 * 消耗积分: 300
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const body = await request.json()
    const { videoUrl, videoId, prompt } = body

    // 验证必填字段
    if (!videoUrl || !prompt) {
      return ApiResponseHelper.validationError('请提供视频URL和提示词')
    }

    // 检查积分（延长 16 秒消耗 300 积分）
    const requiredCredits = 300
    const currentCredits = await CreditService.getUserCredits(user.id)

    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(
        requiredCredits,
        currentCredits
      )
    }

    // 如果提供了 videoId，验证视频所有权
    if (videoId) {
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single()

      if (!video || video.user_id !== user.id) {
        return ApiResponseHelper.unauthorized('无权操作此视频')
      }
    }

    // 调用 Railway 延长视频
    const railwayService = await getRailwayService()
    const result = await railwayService.extendVideo({ videoUrl, prompt })

    if (!result.success) {
      return ApiResponseHelper.serverError(result.error || '视频延长失败')
    }

    // 扣除积分
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'railway_extend',
      'Railway 视频延长 (16秒)'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(
        deductResult.error || '积分扣减失败'
      )
    }

    // 保存延长记录到数据库
    const { error: insertError } = await supabase.from('videos').insert({
      user_id: user.id,
      task_id: result.taskId,
      original_video_url: videoUrl,
      original_video_id: videoId,
      prompt,
      status: 'pending',
      duration: 32, // 延长后总时长 32 秒
      credits_used: requiredCredits,
      provider: result.provider,
      config_name: result.configName,
      is_extension: true,
    })

    if (insertError) {
      console.error('[v0] 保存延长记录失败:', insertError)
    }

    return ApiResponseHelper.success(
      {
        taskId: result.taskId,
        provider: result.provider,
        configName: result.configName,
        creditsUsed: requiredCredits,
        remainingCredits: deductResult.newBalance,
        estimatedTime: '10 分钟',
      },
      '视频延长任务已创建，请等待处理'
    )
  } catch (error) {
    console.error('[v0] Railway extend error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '视频延长失败'
    )
  }
}
