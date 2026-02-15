import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || process.env.MINIMAX_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    const body = await req.json()
    const { model, text, voice_id, speed, vol, pitch } = body

    console.log('[v0] MiniMax sync TTS:', { model, voice_id, textLength: text?.length })

    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'speech-2.8-hd',
        text,
        voice_setting: {
          voice_id: voice_id || 'male-qn-qingse',
          speed: speed || 1,
          vol: vol || 10,
          pitch: pitch || 1,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 2,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] MiniMax sync error:', errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"',
      },
    })
  } catch (error) {
    console.error('[v0] Sync TTS error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '同步合成失败' },
      { status: 500 }
    )
  }
}
