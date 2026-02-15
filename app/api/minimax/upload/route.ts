import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string

    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 })
    }

    console.log('[v0] 上传文件:', { fileName: file.name, purpose })

    // 创建新的 FormData 用于转发
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('purpose', purpose || 'voice_clone')

    // 调用 MiniMax 上传 API
    const response = await fetch('https://api.minimaxi.com/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    })

    const data = await response.json()

    if (!response.ok || data.base_resp?.status_code !== 0) {
      console.error('[v0] MiniMax API 错误:', data)
      return NextResponse.json(
        { error: data.base_resp?.status_msg || '上传文件失败' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      file_id: data.file.file_id,
    })
  } catch (error) {
    console.error('[v0] 上传文件错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
