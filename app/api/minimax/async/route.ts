import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 创建异步语音合成任务
 * 文档: https://platform.minimaxi.com/document/T2A%20Async
 * POST https://api.minimaxi.com/v1/t2a_async_v2
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const body = await request.json()
    const { model, text, voice_id, speed, vol, pitch } = body

    if (!text || !voice_id) {
      return ApiResponseHelper.validationError('缺少必填字段: text, voice_id')
    }

    if (text.length > 100000) {
      return ApiResponseHelper.validationError('异步模式文本长度不能超过 100,000 字符')
    }

    // 从数据库获取 API Key
    const { data: config } = await supabase
      .from('minimax_voice_configs')
      .select('api_key, group_id')
      .eq('enabled', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single()

    if (!config?.api_key) {
      return ApiResponseHelper.serverError('未配置 MiniMax API Key，请先在管理后台 /glht/api 中配置')
    }

    // 构建请求体（严格按照官方文档格式）
    const requestBody: any = {
      model: model || 'speech-2.8-hd',
      text,
      voice_setting: {
        voice_id,
        speed: speed || 1,
        vol: vol !== undefined ? vol : 10,
        pitch: pitch !== undefined ? pitch : 1,
      },
      audio_setting: {
        audio_sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 2,
      },
    }

    if (config.group_id) {
      requestBody.GroupID = config.group_id
    }

    console.log('[v0] Async TTS create request:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.minimaxi.com/v1/t2a_async_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    console.log('[v0] Async TTS create response:', JSON.stringify(data))

    if (data.base_resp?.status_code !== 0 && data.base_resp?.status_code !== undefined) {
      return ApiResponseHelper.serverError(
        `MiniMax API 错误: ${data.base_resp?.status_msg || '未知错误'} (code: ${data.base_resp?.status_code})`
      )
    }

    if (!data.task_id) {
      return ApiResponseHelper.serverError('MiniMax 未返回 task_id')
    }

    return ApiResponseHelper.success({
      taskId: data.task_id,
    }, '异步任务创建成功')
  } catch (error) {
    console.error('[v0] Async TTS create error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '创建异步任务失败'
    )
  }
}

/**
 * 查询异步语音合成任务状态
 * GET https://api.minimaxi.com/v1/query/t2a_async_query_v2?task_id={task_id}
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
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return ApiResponseHelper.validationError('缺少 task_id 参数')
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

    console.log('[v0] Async TTS query:', taskId)

    const response = await fetch(
      `https://api.minimaxi.com/v1/query/t2a_async_query_v2?task_id=${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    console.log('[v0] Async TTS query response:', JSON.stringify(data))

    if (data.base_resp?.status_code !== 0 && data.base_resp?.status_code !== undefined) {
      return ApiResponseHelper.serverError(
        `查询失败: ${data.base_resp?.status_msg || '未知错误'}`
      )
    }

    return ApiResponseHelper.success({
      status: data.status,
      file_id: data.file_id || null,
      audio_info: data.audio_info || null,
    })
  } catch (error) {
    console.error('[v0] Async TTS query error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '查询任务状态失败'
    )
  }
}
