import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || process.env.MINIMAX_API_KEY
    const groupId = req.headers.get('x-group-id')
    const taskId = req.nextUrl.searchParams.get('task_id')

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    if (!taskId) {
      return NextResponse.json({ error: '缺少 task_id' }, { status: 400 })
    }

    const url = new URL('https://api.minimaxi.com/v1/query/text_to_speech_v2')
    url.searchParams.set('task_id', taskId)
    if (groupId) {
      url.searchParams.set('GroupID', groupId)
    }

    console.log('[v0] MiniMax async query:', { taskId, groupId })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()
    console.log('[v0] Async status update:', data)

    // 如果任务成功且有 file_id，构建代理 URL
    if (data.status === 'Success' && data.file_id) {
      data.audio_file = `/api/minimax/audio?file_id=${data.file_id}`
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Async query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '任务查询失败' },
      { status: 500 }
    )
  }
}
