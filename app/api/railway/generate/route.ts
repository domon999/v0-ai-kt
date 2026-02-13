import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRailwayService } from '@/lib/services/railway-service'
import { CreditService } from '@/lib/services/credit-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/railway/generate
 * 
 * 图片生成 16 秒视频
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
    const { imageUrl, prompt } = body

    // 验证必填字段
    if (!imageUrl || !prompt) {
      return ApiResponseHelper.validationError('请提供图片URL和提示词')
    }

    // 检查积分（生成 16 秒视频消耗 300 积分）
    const requiredCredits = 300
    const currentCredits = await CreditService.getUserCredits(user.id)

    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(
        requiredCredits,
        currentCredits
      )
    }

    // 调用 Railway 生成视频
    const railwayService = await getRailwayService()
    const result = await railwayService.generateVideo({ imageUrl, prompt })

    if (!result.success) {
      return ApiResponseHelper.serverError(result.error || '视频生成失败')
    }

    // 扣除积分
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'railway_generate',
      'Railway 视频生成 (16秒)'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(
        deductResult.error || '积分扣减失败'
      )
    }

    // 保存到数据库（videos 表）
    const { error: insertError } = await supabase.from('videos').insert({
      user_id: user.id,
      task_id: result.taskId,
      image_url: imageUrl,
      prompt,
      status: 'pending',
      duration: 16,
      credits_used: requiredCredits,
      provider: result.provider,
      config_name: result.configName,
    })

    if (insertError) {
      console.error('[v0] 保存视频记录失败:', insertError)
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
      '视频生成任务已创建，请等待处理'
    )
  } catch (error) {
    console.error('[v0] Railway generate error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '视频生成失败'
    )
  }
}
