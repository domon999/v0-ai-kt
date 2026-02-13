import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BananaService } from '@/lib/services/banana-service'
import { CreditService } from '@/lib/services/credit-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'
import { validateRequired } from '@/lib/utils/validation'

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
    const { image_url, prompt } = body

    // Validate required fields
    const validation = validateRequired(body, ['image_url'])
    if (!validation.valid) {
      return ApiResponseHelper.validationError(
        `缺少必填字段: ${validation.missing?.join(', ')}`
      )
    }

    // Check user credits
    const requiredCredits = 200
    const currentCredits = await CreditService.getUserCredits(user.id)
    
    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(requiredCredits, currentCredits)
    }

    // Call Banana API
    const bananaService = new BananaService()
    const result = await bananaService.generateDigitalHuman(image_url, prompt)

    if (!result.success) {
      return ApiResponseHelper.serverError(result.error || '数字人生成失败')
    }

    // Deduct credits
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'digital_human',
      '数字人生成'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(deductResult.error || '积分扣减失败')
    }

    return ApiResponseHelper.success({
      image_url: result.image_url,
      credits_used: requiredCredits,
      remaining_credits: deductResult.newBalance,
    }, '数字人生成成功')
  } catch (error) {
    console.error('[v0] Banana API error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '服务器错误，请稍后重试'
    )
  }
}
