import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMinimaxTTSService } from '@/lib/services/minimax-tts-service'
import { CreditService } from '@/lib/services/credit-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  console.log('[v0] TTS API called')
  try {
    console.log('[v0] Creating Supabase client...')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[v0] User check:', { hasUser: !!user })

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const body = await request.json()
    const { text, voiceId, model, speed, volume, pitch } = body

    console.log('[v0] Request params:', { textLength: text?.length, voiceId, model })

    if (!text || !voiceId) {
      console.log('[v0] Validation failed')
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
    console.log('[v0] Getting MiniMax TTS service...')
    let ttsService
    try {
      ttsService = await getMinimaxTTSService()
    } catch (serviceError) {
      console.error('[v0] Failed to get MiniMax TTS service:', serviceError)
      return ApiResponseHelper.serverError(
        serviceError instanceof Error 
          ? serviceError.message 
          : '无法获取 MiniMax 服务，请确保已在管理后台配置 MiniMax API'
      )
    }
    
    console.log('[v0] TTS service obtained, calling textToSpeech...')
    const result = await ttsService.textToSpeech({
      text,
      voiceId,
      model,
      speed,
      volume,
      pitch,
    })

    console.log('[v0] TTS result:', { success: result.success, error: result.error })

    if (!result.success) {
      console.error('[v0] TTS failed:', result.error)
      return ApiResponseHelper.serverError(result.error || 'MiniMax TTS 失败')
    }

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('minimax_generated_audio')
      .insert({
        user_id: user.id,
        text,
        voice_id: voiceId,
        model: model || 'speech-2.8-hd',
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

    console.log('[v0] TTS success, returning response')
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
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : 'TTS 生成失败，请稍后重试'
    )
  }
}
