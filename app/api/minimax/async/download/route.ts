import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 下载异步语音合成文件
 * GET https://api.minimaxi.com/v1/files/retrieve_content?file_id={file_id}
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('file_id')

    if (!fileId) {
      return ApiResponseHelper.validationError('缺少 file_id 参数')
    }

    // 从数据库获取 API Key
    const { data: config } = await supabase
      .from('minimax_voice_configs')
      .select('api_key')
      .eq('enabled', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single()

    if (!config?.api_key) {
      return ApiResponseHelper.serverError('未配置 MiniMax API Key')
    }

    console.log('[v0] Downloading audio file:', fileId)

    const response = await fetch(
      `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${fileId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('[v0] Download failed:', response.status)
      return ApiResponseHelper.serverError(`下载失败: HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[v0] Downloaded audio size:', buffer.length, 'bytes')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[v0] Download error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '下载文件失败'
    )
  }
}
