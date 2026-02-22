import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

// 音色克隆
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
    const {
      file_id,
      voice_id,
      text,
      model,
      clone_prompt,
      api_key: customApiKey,
      group_id: customGroupId,
    } = body

    if (!file_id || !voice_id || !text) {
      return ApiResponseHelper.validationError('缺少必填字段: file_id, voice_id, text')
    }

    console.log('[v0] Voice clone request:', {
      file_id,
      voice_id,
      textLength: text.length,
      model: model || 'speech-2.8-hd',
      hasClonePrompt: !!clone_prompt,
      hasCustomKey: !!customApiKey,
    })

    // 获取 API Key
    let apiKey = customApiKey
    let groupId = customGroupId

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

    // 构建请求体
    const requestBody: any = {
      file_id,
      voice_id,
      text,
      model: model || 'speech-2.8-hd',
    }

    if (clone_prompt) {
      requestBody.clone_prompt = clone_prompt
    }

    if (groupId) {
      requestBody.GroupID = groupId
    }

    console.log('[v0] Calling MiniMax voice clone API:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.minimaxi.com/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()
    console.log('[v0] Voice clone response:', {
      status: response.status,
      data: responseData,
    })

    if (!response.ok) {
      return ApiResponseHelper.serverError(
        responseData.error?.message || responseData.message || `克隆失败: HTTP ${response.status}`
      )
    }

    // MiniMax 返回的是音频 Base64 或 URL
    return ApiResponseHelper.success(
      {
        voice_id,
        audio: responseData.audio,
        extra_info: responseData.extra_info,
      },
      '声音克隆成功'
    )
  } catch (error) {
    console.error('[v0] Voice clone error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '克隆失败'
    )
  }
}
