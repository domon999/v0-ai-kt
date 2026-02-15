import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || process.env.MINIMAX_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string

    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 })
    }

    console.log('[v0] MiniMax file upload:', {
      fileName: file.name,
      fileSize: file.size,
      purpose,
    })

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('purpose', purpose || 'voice_clone')

    const response = await fetch('https://api.minimaxi.com/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    })

    const data = await response.json()
    console.log('[v0] Upload response:', data)

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '文件上传失败' },
      { status: 500 }
    )
  }
}
