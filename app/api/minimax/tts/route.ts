import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MinimaxService } from '@/lib/services/minimax-service'

// TTS 价格计算函数：约 10 积分/100字
function calculateTTSCredits(textLength: number): number {
  return Math.ceil((textLength / 100) * 10)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { text, voiceId } = await request.json()

    if (!text || !voiceId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const textLength = text.length
    const creditsNeeded = calculateTTSCredits(textLength)

    // 检查积分余额
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.credits < creditsNeeded) {
      return NextResponse.json(
        { error: `积分不足，需要 ${creditsNeeded} 积分` },
        { status: 400 }
      )
    }

    // 获取声音记录
    const { data: voice } = await supabase
      .from('voices')
      .select('*')
      .eq('id', voiceId)
      .eq('user_id', user.id)
      .single()

    if (!voice) {
      return NextResponse.json({ error: '声音不存在或无权访问' }, { status: 404 })
    }

    // 调用 MiniMax TTS
    const minimaxService = new MinimaxService()
    const result = await minimaxService.textToSpeech(text, voice.voice_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // 扣除积分
    const { data: consumed } = await supabase.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: creditsNeeded,
      p_description: `TTS: ${textLength} 字`,
      p_type: '消费',
    })

    if (!consumed) {
      return NextResponse.json({ error: '扣除积分失败' }, { status: 500 })
    }

    // 保存 TTS 记录
    await supabase.from('tts_records').insert({
      user_id: user.id,
      voice_id: voiceId,
      text,
      text_length: textLength,
      audio_url: result.audioUrl!,
      credits_used: creditsNeeded,
    })

    // 更新声音使用统计
    await supabase
      .from('voices')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: voice.usage_count + 1,
      })
      .eq('id', voiceId)

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      creditsUsed: creditsNeeded,
      textLength,
    })
  } catch (error: any) {
    console.error('[v0] TTS error:', error)
    return NextResponse.json({ error: error.message || 'TTS 失败' }, { status: 500 })
  }
}
