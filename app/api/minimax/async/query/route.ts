import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('task_id')
    const apiKey = searchParams.get('api_key') || process.env.MINIMAX_API_KEY
    const groupId = searchParams.get('group_id')

    if (!taskId) {
      return NextResponse.json({ error: '缺少 task_id 参数' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    console.log('[v0] 查询任务状态:', { taskId, groupId })

    // 调用 MiniMax 查询 API
    const url = new URL('https://api.minimaxi.com/v1/query/text_to_speech_v2')
    url.searchParams.set('task_id', taskId)
    if (groupId) {
      url.searchParams.set('GroupId', groupId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok || data.base_resp?.status_code !== 0) {
      console.error('[v0] MiniMax API 错误:', data)
      return NextResponse.json(
        { error: data.base_resp?.status_msg || '查询任务失败' },
        { status: response.status }
      )
    }

    const result: any = {
      task_id: taskId,
      status: data.status,
    }

    // 如果任务成功，返回音频代理URL
    if (data.status === 'Success' && data.file_id) {
      result.file_id = data.file_id
      result.audio_file = `/api/minimax/audio?file_id=${data.file_id}&api_key=${apiKey}`
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] 查询任务错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
