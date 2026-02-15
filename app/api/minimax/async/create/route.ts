import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || process.env.MINIMAX_API_KEY
    const groupId = req.headers.get('x-group-id')

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    const body = await req.json()
    const { model, text, voice_id } = body

    console.log('[v0] MiniMax async TTS create:', {
      model,
      voice_id,
      textLength: text?.length,
      groupId,
    })

    const requestBody = {
      model: model || 'speech-2.8-hd',
      text,
      ...(groupId && { GroupID: groupId }),
      voice_setting: {
        voice_id: voice_id || 'male-qn-qingse',
        speed: 1,
        vol: 10,
        pitch: 1,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 2,
      },
    }

    console.log('[v0] MiniMax request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.minimaxi.com/v1/t2a_async_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    console.log('[v0] MiniMax async create response:', data)

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Async create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '异步任务创建失败' },
      { status: 500 }
    )
  }
}
