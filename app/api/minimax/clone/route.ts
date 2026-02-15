import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMinimaxService } from '@/lib/services/minimax-voice-service'
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const voiceId = formData.get('voiceId') as string
    const voiceName = formData.get('voiceName') as string
    const needNoiseReduction = formData.get('needNoiseReduction') === 'true'
    const needVolumeNormalization =
      formData.get('needVolumeNormalization') === 'true'

    if (!file || !voiceId || !voiceName) {
      return ApiResponseHelper.validationError('缺少必填字段')
    }

    // 检查 voiceId 格式
    if (!/^[a-zA-Z][a-zA-Z0-9]{7,}$/.test(voiceId)) {
      return ApiResponseHelper.validationError(
        'Voice ID 必须以字母开头，至少8个字符，只包含字母和数字'
      )
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('minimax_cloned_voices')
      .select('id')
      .eq('user_id', user.id)
      .eq('voice_id', voiceId)
      .single()

    if (existing) {
      return ApiResponseHelper.validationError('该 Voice ID 已存在')
    }

    // 检查用户积分
    const requiredCredits = 500 // 声音克隆消耗 500 积分
    const currentCredits = await CreditService.getUserCredits(user.id)

    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(
        requiredCredits,
        currentCredits
      )
    }

    // 调用 MiniMax API
    const minimaxService = await getMinimaxService()
    const result = await minimaxService.cloneVoice({
      file,
      voiceId,
      voiceName,
      needNoiseReduction,
      needVolumeNormalization,
    })

    if (!result.success) {
      return ApiResponseHelper.serverError(
        result.error || 'MiniMax API 克隆失败'
      )
    }

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('minimax_cloned_voices')
      .insert({
        user_id: user.id,
        name: voiceName,
        voice_id: voiceId,
        file_id: result.data.fileId,
        need_noise_reduction: needNoiseReduction,
        need_volume_normalization: needVolumeNormalization,
        demo_audio_url: result.data.demoAudioUrl,
        provider: result.provider,
      })

    if (insertError) {
      return ApiResponseHelper.serverError('保存声音失败: ' + insertError.message)
    }

    // 扣除积分
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'voice_clone',
      '声音克隆'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(
        deductResult.error || '积分扣减失败'
      )
    }

    return ApiResponseHelper.success(
      {
        voiceId,
        voiceName,
        demoAudioUrl: result.data.demoAudioUrl,
        provider: result.provider,
        creditsUsed: requiredCredits,
        remainingCredits: deductResult.newBalance,
      },
      '声音克隆成功'
    )
  } catch (error) {
    console.error('[v0] MiniMax clone error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '声音克隆失败，请稍后重试'
    )
  }
}
