import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * MiniMax TTS API - 同步语音合成
 * 文档: https://platform.minimaxi.com/document/speech-synthesis
 */
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

    // 获取 MiniMax API 配置
    const { data: configs } = await supabase
      .from('minimax_voice_configs')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single()

    if (!configs) {
      return NextResponse.json(
        { error: '未配置 MiniMax API，请先在管理后台添加配置' },
        { status: 400 }
      )
    }

    console.log('[v0] Using config:', configs.provider)

    // 调用 MiniMax TTS API
    const minimaxResponse = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configs.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'speech-2.8-hd',
        text,
        voice_id: voiceId,
        speed: speed || 1.0,
        vol: volume || 1.0,
        pitch: pitch || 0,
        format: 'mp3',
      }),
    })

    if (!minimaxResponse.ok) {
      const errorText = await minimaxResponse.text()
      console.error('[v0] MiniMax API error:', errorText)
      
      // 记录失败
      await supabase
        .from('minimax_voice_configs')
        .update({
          failed_requests: (configs.failed_requests || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configs.id)

      return NextResponse.json(
        { error: `MiniMax API 错误: ${minimaxResponse.statusText}` },
        { status: 500 }
      )
    }

    const audioData = await minimaxResponse.json()
    console.log('[v0] MiniMax response:', { hasAudio: !!audioData.data?.audio })

    if (!audioData.data?.audio) {
      return NextResponse.json(
        { error: 'MiniMax 未返回音频数据' },
        { status: 500 }
      )
    }

    // 将 Base64 音频解码并上传到 Vercel Blob
    const audioBuffer = Buffer.from(audioData.data.audio, 'base64')
    const blob = await put(`tts/${user.id}/${Date.now()}.mp3`, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
    })

    console.log('[v0] Audio uploaded to Blob:', blob.url)

    // 计算积分消耗（每10个字符1积分）
    const creditsUsed = Math.ceil(text.length / 10)

    // 扣除积分
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (!userCredits || userCredits.credits < creditsUsed) {
      return NextResponse.json(
        { error: `积分不足，需要 ${creditsUsed} 积分` },
        { status: 400 }
      )
    }

    await supabase.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: creditsUsed,
      p_description: `TTS: ${text.substring(0, 20)}...`,
      p_type: '消费',
    })

    // 保存记录
    await supabase.from('minimax_generated_audio').insert({
      user_id: user.id,
      text,
      voice_id: voiceId,
      model: model || 'speech-2.8-hd',
      audio_url: blob.url,
      duration: audioData.data.duration,
      speed: speed || 1.0,
      volume: volume || 1.0,
      pitch: pitch || 0,
      provider: configs.provider,
    })

    // 记录成功
    await supabase
      .from('minimax_voice_configs')
      .update({
        success_requests: (configs.success_requests || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', configs.id)

    return NextResponse.json({
      success: true,
      audioUrl: blob.url,
      duration: audioData.data.duration,
      creditsUsed,
      remainingCredits: userCredits.credits - creditsUsed,
    })
  } catch (error) {
    console.error('[v0] TTS error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '语音合成失败' 
      },
      { status: 500 }
    )
  }
}
