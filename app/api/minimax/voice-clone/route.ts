import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

/**
 * POST /api/minimax/voice-clone
 * 声音克隆 API
 * 
 * 请求体：
 * {
 *   file: File (form-data),
 *   voice_id: string,
 *   voice_name: string,
 *   prompt_file?: File (form-data, optional),
 *   prompt_text?: string (optional),
 *   api_key?: string (optional, 自定义 API Key),
 *   group_id?: string (optional, 自定义 Group ID)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/minimax/voice-clone - Start')

    const supabase = await createClient()
    const formData = await request.formData()

    const file = formData.get('file') as File
    const voiceId = formData.get('voice_id') as string
    const voiceName = formData.get('voice_name') as string
    const promptFile = formData.get('prompt_file') as File | null
    const promptText = formData.get('prompt_text') as string | null
    let apiKey = formData.get('api_key') as string | null
    let groupId = formData.get('group_id') as string | null

    console.log('[v0] Request params:', { voiceId, voiceName, hasFile: !!file, hasPromptFile: !!promptFile })

    if (!file || !voiceId || !voiceName) {
      return ApiResponseHelper.validationError('缺少必填字段: file, voice_id, voice_name')
    }

    // 如果未提供 API Key，从数据库获取
    if (!apiKey) {
      const { data: config } = await supabase
        .from('minimax_voice_configs')
        .select('api_key, group_id')
        .eq('enabled', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single()

      if (!config?.api_key) {
        return ApiResponseHelper.serverError('未配置 MiniMax API Key')
      }

      apiKey = config.api_key
      groupId = groupId || config.group_id
    }

    console.log('[v0] API Key resolved, usingCustom:', !!formData.get('api_key'))

    // 构建 FormData 发送给 MiniMax API
    const cloneFormData = new FormData()
    cloneFormData.append('file', file, file.name)
    cloneFormData.append('voice_id', voiceId)

    if (promptFile && promptText) {
      cloneFormData.append('prompt_audio', promptFile, promptFile.name)
      cloneFormData.append('prompt_text', promptText)
    }

    console.log('[v0] Calling MiniMax voice clone API...')

    const response = await fetch('https://api.minimaxi.com/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...(groupId && { 'GroupID': groupId }),
      },
      body: cloneFormData,
    })

    console.log('[v0] MiniMax response status:', response.status)

    const responseData = await response.json()
    console.log('[v0] MiniMax response:', JSON.stringify(responseData).slice(0, 200))

    if (!response.ok) {
      const error = responseData.error || responseData.message || `HTTP ${response.status}`
      console.error('[v0] Voice clone failed:', error)
      return ApiResponseHelper.serverError(`克隆失败: ${error}`)
    }

    if (responseData.status_code !== 0 && !responseData.success) {
      const error = responseData.error_msg || responseData.message || '克隆失败'
      console.error('[v0] Voice clone error:', error)
      return ApiResponseHelper.serverError(error)
    }

    console.log('[v0] Voice clone success')

    return ApiResponseHelper.success({
      voiceId: voiceId,
      voiceName: voiceName,
      message: '声音克隆成功',
    }, '声音克隆成功')
  } catch (error) {
    console.error('[v0] Voice clone error:', error)
    return ApiResponseHelper.serverError('声音克隆失败')
  }
}
