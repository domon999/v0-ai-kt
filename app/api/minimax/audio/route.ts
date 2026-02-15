import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('file_id')
    const apiKey = searchParams.get('api_key') || process.env.MINIMAX_API_KEY

    if (!fileId) {
      return NextResponse.json({ error: '缺少 file_id 参数' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    console.log('[v0] 代理下载音频:', fileId)

    // 从 MiniMax 下载音频
    const url = `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${fileId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] MiniMax API 错误:', error)
      return NextResponse.json(
        { error: error.base_resp?.status_msg || '下载音频失败' },
        { status: response.status }
      )
    }

    // 返回音频流
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('[v0] 代理下载错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
