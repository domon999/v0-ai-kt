import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MinimaxService } from '@/lib/services/minimax-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { voiceName, audioUrl } = await request.json()

    if (!voiceName || !audioUrl) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 检查积分余额 (声音克隆需要 1200 积分)
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.credits < 1200) {
      return NextResponse.json({ error: '积分不足，需要 1200 积分' }, { status: 400 })
    }

    // 调用 MiniMax 克隆声音
    const minimaxService = new MinimaxService()
    const result = await minimaxService.cloneVoice(audioUrl, voiceName)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // 扣除积分
    const { data: consumed } = await supabase.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: 1200,
      p_description: `声音克隆: ${voiceName}`,
      p_type: '消费',
    })

    if (!consumed) {
      return NextResponse.json({ error: '扣除积分失败' }, { status: 500 })
    }

    // 保存声音记录到数据库
    const { data: voice, error: insertError } = await supabase
      .from('voices')
      .insert({
        user_id: user.id,
        voice_name: voiceName,
        voice_id: result.voiceId,
        audio_url: audioUrl,
        credits_used: 1200,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: '保存声音记录失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voice,
      voiceId: result.voiceId,
    })
  } catch (error: any) {
    console.error('[v0] Clone voice error:', error)
    return NextResponse.json({ error: error.message || '克隆声音失败' }, { status: 500 })
  }
}
