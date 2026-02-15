import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 音频文件代理 API
 * 用于代理 MiniMax 音频文件下载，解决需要 Authorization 头的问题
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileId = searchParams.get('file_id')
    
    // 从请求头或 URL 参数获取 API Key
    const apiKeyFromHeader = request.headers.get('X-API-Key')
    const apiKeyFromParam = searchParams.get('api_key')
    const apiKey = apiKeyFromHeader || apiKeyFromParam || process.env.MINIMAX_API_KEY

    if (!fileId) {
      return NextResponse.json({ error: '缺少 file_id 参数' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key，请配置环境变量或传递参数' }, { status: 401 })
    }

    console.log('[v0] 代理下载音频 file_id:', fileId)

    // 从 MiniMax API 下载音频文件
    const url = `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${fileId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] MiniMax API 错误:', errorText)
      
      let errorMessage = '下载音频失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.base_resp?.status_msg || errorMessage
      } catch {
        // 解析失败，使用默认错误消息
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // 直接返回音频流，不存储到 blob
    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400', // 缓存 24 小时
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[v0] 代理下载音频错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
