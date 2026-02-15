import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const apiKey = searchParams.get('api_key') || process.env.MINIMAX_API_KEY
    const fileId = searchParams.get('file_id')

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    if (!fileId) {
      return NextResponse.json({ error: '缺少 file_id' }, { status: 400 })
    }

    console.log('[v0] MiniMax audio proxy:', { fileId })

    const response = await fetch(
      `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Audio download error:', errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="audio.mp3"',
      },
    })
  } catch (error) {
    console.error('[v0] Audio proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '音频下载失败' },
      { status: 500 }
    )
  }
}
