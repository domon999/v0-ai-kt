import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    const groupId = request.headers.get('X-Group-ID')

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { model, text, voice_id } = body

    if (!text || !voice_id) {
      return NextResponse.json({ error: '缺少必填参数' }, { status: 400 })
    }

    console.log('[v0] 创建异步任务:', { model, voice_id, textLength: text.length, groupId })

    // 调用 MiniMax 异步 API
    const response = await fetch('https://api.minimaxi.com/v1/t2a_async_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'speech-2.8-hd',
        text,
        voice_id,
        audio_sample_rate: 32000,
        bitrate: 128000,
        ...(groupId && { GroupId: groupId }),
      }),
    })

    const data = await response.json()

    if (!response.ok || data.base_resp?.status_code !== 0) {
      console.error('[v0] MiniMax API 错误:', data)
      return NextResponse.json(
        { error: data.base_resp?.status_msg || '创建任务失败' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      task_id: data.task_id,
      status: 'Submitted',
    })
  } catch (error) {
    console.error('[v0] 创建异步任务错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
