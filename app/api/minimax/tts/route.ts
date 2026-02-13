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

    const body = await request.json()
    const { text, voiceId, model, speed, volume, pitch } = body

    if (!text || !voiceId) {
      return ApiResponseHelper.validationError('缺少必填字段: text, voiceId')
    }

    // 检查文本长度
    if (text.length > 5000) {
      return ApiResponseHelper.validationError('文本长度不能超过 5000 字符')
    }

    // 检查用户积分
    const requiredCredits = Math.ceil(text.length / 10) // 每10个字符消耗1积分
    const currentCredits = await CreditService.getUserCredits(user.id)

    if (currentCredits < requiredCredits) {
      return ApiResponseHelper.insufficientCredits(
        requiredCredits,
        currentCredits
      )
    }

    // 调用 MiniMax API
    const minimaxService = await getMinimaxService()
    const result = await minimaxService.textToSpeech({
      text,
      voiceId,
      model,
      speed,
      volume,
      pitch,
    })

    if (!result.success) {
      return ApiResponseHelper.serverError(result.error || 'MiniMax TTS 失败')
    }

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('minimax_generated_audio')
      .insert({
        user_id: user.id,
        text,
        voice_id: voiceId,
        model: model || 'speech-2.6-hd',
        audio_url: result.data.audioUrl,
        duration: result.data.duration,
        speed: speed || 1.0,
        volume: volume || 1.0,
        pitch: pitch || 0,
        provider: result.provider,
      })

    if (insertError) {
      console.error('[v0] Failed to save audio:', insertError)
      // 不阻塞响应
    }

    // 扣除积分
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'tts',
      'TTS 语音合成'
    )

    if (!deductResult.success) {
      return ApiResponseHelper.serverError(
        deductResult.error || '积分扣减失败'
      )
    }

    return ApiResponseHelper.success(
      {
        audioUrl: result.data.audioUrl,
        duration: result.data.duration,
        subtitles: result.data.subtitles,
        provider: result.provider,
        creditsUsed: requiredCredits,
        remainingCredits: deductResult.newBalance,
      },
      'TTS 生成成功'
    )
  } catch (error) {
    console.error('[v0] MiniMax TTS error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : 'TTS 生成失败，请稍后重试'
    )
  }
}
