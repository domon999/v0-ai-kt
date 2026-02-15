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
    const { file_id, voice_id, clone_prompt, text, model } = body

    console.log('[v0] MiniMax voice clone:', {
      file_id,
      voice_id,
      hasPrompt: !!clone_prompt,
      textLength: text?.length,
    })

    const response = await fetch('https://api.minimaxi.com/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id,
        voice_id,
        ...(clone_prompt && { clone_prompt }),
        text: text || '这是克隆的声音测试',
        model: model || 'speech-2.8-hd',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[v0] Clone error:', errorData)
      return NextResponse.json(errorData, { status: response.status })
    }

    // 返回音频流
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${voice_id}.mp3"`,
      },
    })
  } catch (error) {
    console.error('[v0] Clone API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '音色复刻失败' },
      { status: 500 }
    )
  }
}
