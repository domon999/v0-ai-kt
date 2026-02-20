import { type NextRequest } from 'next/server'

/**
 * 音频代理 API
 * 用于代理下载 MiniMax 音频文件，解决浏览器 audio 标签无法携带 Authorization 头的问题
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file_id')
    const apiKey = searchParams.get('api_key')

    console.log('[v0] Audio proxy request:', { fileId, hasApiKey: !!apiKey })

    if (!fileId || !apiKey) {
      return new Response('缺少必填参数: file_id 和 api_key', { status: 400 })
    }

    // 代理请求到 MiniMax API
    const response = await fetch(
      `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${encodeURIComponent(fileId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    console.log('[v0] MiniMax response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax error:', error)
      return new Response(`MiniMax API 错误: ${response.statusText}`, { 
        status: response.status,
      })
    }

    // 获取音频数据
    const audioBuffer = await response.arrayBuffer()
    console.log('[v0] Audio size:', audioBuffer.byteLength, 'bytes')

    // 返回音频流，带正确的 CORS 和缓存头
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('[v0] Audio proxy error:', error)
    return new Response(
      error instanceof Error ? error.message : '代理失败',
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
