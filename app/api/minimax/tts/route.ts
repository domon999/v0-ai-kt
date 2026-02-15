import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMinimaxTTSService } from '@/lib/services/minimax-tts-service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  console.log('[v0] TTS API called')
  
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { text, voiceId, model, speed, volume, pitch } = body

    console.log('[v0] Request params:', { 
      textLength: text?.length, 
      voiceId, 
      model 
    })

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: '缺少必填字段: text, voiceId' },
        { status: 400 }
      )
    }

    // 检查文本长度
    if (text.length > 10000) {
      return NextResponse.json(
        { error: '文本长度不能超过 10000 字符' },
        { status: 400 }
      )
    }

    // 计算所需积分（每10个字符消耗1积分）
    const requiredCredits = Math.ceil(text.length / 10)

    // 检查用户积分
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    const currentCredits = userCredits?.credits || 0

    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        {
          error: `积分不足，需要 ${requiredCredits} 积分，当前仅有 ${currentCredits} 积分`,
        },
        { status: 400 }
      )
    }

    // 调用 MiniMax TTS API
    console.log('[v0] Getting MiniMax TTS service...')
    let ttsService
    try {
      ttsService = await getMinimaxTTSService()
    } catch (serviceError) {
      console.error('[v0] Failed to get TTS service:', serviceError)
      return NextResponse.json(
        {
          error:
            serviceError instanceof Error
              ? serviceError.message
              : '无法获取 MiniMax 服务',
        },
        { status: 500 }
      )
    }

    console.log('[v0] Calling textToSpeech...')
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
      return NextResponse.json(
        { error: result.error || 'TTS 生成失败' },
        { status: 500 }
      )
    }

    // 扣除积分
    const { error: deductError } = await supabase.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: requiredCredits,
      p_description: `MiniMax TTS: ${text.length} 字符`,
      p_type: '消费',
    })

    if (deductError) {
      console.error('[v0] Failed to deduct credits:', deductError)
      // 不阻塞响应，只记录错误
    }

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('minimax_generated_audio')
      .insert({
        user_id: user.id,
        text,
        voice_id: voiceId,
        model: model || 'speech-2.8-hd',
        audio_url: result.data!.audioUrl,
        duration: result.data?.duration,
        speed: speed || 1.0,
        volume: volume || 1.0,
        pitch: pitch || 0,
        provider: result.provider || 'MiniMax',
      })

    if (insertError) {
      console.error('[v0] Failed to save audio record:', insertError)
      // 不阻塞响应
    }

    // 获取更新后的积分余额
    const { data: newCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    console.log('[v0] TTS success')
    return NextResponse.json({
      success: true,
      audioUrl: result.data!.audioUrl,
      duration: result.data?.duration,
      provider: result.provider,
      creditsUsed: requiredCredits,
      remainingCredits: newCredits?.credits || 0,
    })
  } catch (error) {
    console.error('[v0] TTS API error:', error)
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'TTS 生成失败，请稍后重试',
      },
      { status: 500 }
    )
  }
}
