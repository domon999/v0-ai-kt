import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || process.env.MINIMAX_API_KEY
    const groupId = req.headers.get('x-group-id')
    const taskId = req.nextUrl.searchParams.get('task_id')

    console.log('[v0] Query request:', { 
      hasApiKey: !!apiKey, 
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      taskId, 
      groupId 
    })

    if (!apiKey) {
      console.error('[v0] Missing API Key')
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    if (!taskId) {
      console.error('[v0] Missing task_id')
      return NextResponse.json({ error: '缺少 task_id' }, { status: 400 })
    }

    const url = new URL('https://api.minimaxi.com/v1/query/text_to_speech_v2')
    url.searchParams.set('task_id', taskId)
    if (groupId) {
      url.searchParams.set('GroupID', groupId)
    }

    console.log('[v0] Query URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    console.log('[v0] MiniMax response status:', response.status)

    const data = await response.json()
    console.log('[v0] MiniMax query API response:', JSON.stringify(data, null, 2))

    // 检查 MiniMax API 错误响应
    if (data.base_resp?.status_code !== 0 && data.base_resp?.status_code !== undefined) {
      console.error('[v0] MiniMax API error:', data.base_resp)
      return NextResponse.json({ 
        message: '查询任务失败', 
        error: data.base_resp?.status_msg || 'Unknown error',
        status_code: data.base_resp?.status_code,
        task_id: taskId
      }, { status: 400 })
    }

    // 如果任务成功且有 file_id，构建代理 URL
    if (data.status === 'Success' && data.file_id) {
      data.audio_file = `/api/minimax/audio?file_id=${data.file_id}`
      console.log('[v0] Task completed, audio_file:', data.audio_file)
    }

    if (!response.ok) {
      console.error('[v0] HTTP error:', response.status)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Async query error:', error)
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '任务查询失败' },
      { status: 500 }
    )
  }
}
