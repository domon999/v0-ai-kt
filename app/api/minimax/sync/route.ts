import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { model, text, voice_id, speed, vol, pitch } = body

    if (!text || !voice_id) {
      return NextResponse.json({ error: '缺少必填参数' }, { status: 400 })
    }

    console.log('[v0] 同步语音合成:', { model, voice_id, textLength: text.length })

    // 调用 MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'speech-2.6-turbo',
        text,
        voice_id,
        speed: speed || 1.0,
        vol: vol || 1.0,
        pitch: pitch || 0,
        audio_sample_rate: 32000,
        bitrate: 128000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] MiniMax API 错误:', error)
      return NextResponse.json(
        { error: error.base_resp?.status_msg || '语音合成失败' },
        { status: response.status }
      )
    }

    // 返回音频流
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"',
      },
    })
  } catch (error) {
    console.error('[v0] 同步合成错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
