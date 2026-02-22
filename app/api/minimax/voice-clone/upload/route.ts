import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

// 上传音频文件到 MiniMax（用于声音克隆）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string // "voice_clone" 或 "prompt_audio"
    const customApiKey = formData.get('api_key') as string | null
    const customGroupId = formData.get('group_id') as string | null

    if (!file) {
      return ApiResponseHelper.validationError('缺少文件')
    }

    if (!purpose || !['voice_clone', 'prompt_audio'].includes(purpose)) {
      return ApiResponseHelper.validationError('purpose 必须是 voice_clone 或 prompt_audio')
    }

    // 验证文件格式
    const validFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a']
    if (!validFormats.some(format => file.type.includes(format) || file.name.toLowerCase().endsWith(format.split('/')[1]))) {
      return ApiResponseHelper.validationError('仅支持 mp3、m4a、wav 格式')
    }

    // 验证文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      return ApiResponseHelper.validationError('文件大小不能超过 20MB')
    }

    console.log('[v0] Voice clone upload:', {
      fileName: file.name,
      fileSize: file.size,
      purpose,
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

    // 准备上传到 MiniMax
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('purpose', purpose)

    const uploadUrl = 'https://api.minimaxi.com/v1/files/upload'
    console.log('[v0] Uploading to MiniMax:', uploadUrl)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    })

    const responseData = await response.json()
    console.log('[v0] MiniMax upload response:', {
      status: response.status,
      data: responseData,
    })

    if (!response.ok) {
      return ApiResponseHelper.serverError(
        responseData.error?.message || `上传失败: HTTP ${response.status}`
      )
    }

    const fileId = responseData.file?.file_id
    if (!fileId) {
      return ApiResponseHelper.serverError('未返回 file_id')
    }

    return ApiResponseHelper.success(
      {
        file_id: fileId,
        file_name: file.name,
        file_size: file.size,
        purpose,
      },
      '文件上传成功'
    )
  } catch (error) {
    console.error('[v0] Voice clone upload error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '上传失败'
    )
  }
}
