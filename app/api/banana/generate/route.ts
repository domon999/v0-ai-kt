import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBananaService } from '@/lib/services/banana-service'
import { CreditService } from '@/lib/services/credit-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const { prompt, image, backgroundImage, imageUrl, backgroundImageUrl } =
      body

    // 验证至少有一个输入
    if (!prompt && !image && !imageUrl) {
      return ApiResponseHelper.validationError(
        '请提供提示词、图片或图片URL'
      )
    }

    // 检查用户积分
    const requiredCredits = 200 // Banana 图生图消耗 200 积分
    const currentCredits = await CreditService.getUserCredits(user.id)

    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(
        requiredCredits,
        currentCredits
      )
    }

    // 调用 Banana API
    const bananaService = getBananaService()
    const result = await bananaService.generate({
      prompt,
      image,
      backgroundImage,
      imageUrl,
      backgroundImageUrl,
    })

    if (!result.success) {
      return ApiResponseHelper.serverError(
        result.error || 'Banana API 生成失败'
      )
    }

    // 扣除积分
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'banana_generate',
      'Banana 图片生成'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(
        deductResult.error || '积分扣减失败'
      )
    }

    return ApiResponseHelper.success(
      {
        content: result.content,
        imageUrls: result.imageUrls,
        provider: result.provider,
        configName: result.configName,
        creditsUsed: requiredCredits,
        remainingCredits: deductResult.newBalance,
      },
      '图片生成成功'
    )
  } catch (error) {
    console.error('[v0] Banana generate error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '图片生成失败，请稍后重试'
    )
  }
}
