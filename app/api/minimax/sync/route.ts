import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 同步语音合成 API
 * 根据文档: https://platform.minimaxi.com/document/T2A%20V2
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
    let apiKey = body.api_key
    let groupId = body.group_id
    const { model, text, voice_id, speed, vol, pitch } = body

    console.log('[v0] Sync TTS request:', { 
      textLength: text?.length, 
      voice_id, 
      model,
      hasApiKey: !!apiKey 
    })

    // 验证必填参数
    if (!text || !voice_id) {
      return ApiResponseHelper.validationError('缺少必填字段: text, voice_id')
    }

    if (text.length > 10000) {
      return ApiResponseHelper.validationError('文本长度不能超过 10,000 字符')
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
        return ApiResponseHelper.serverError('未配置 MiniMax API Key，请先在管理后台配置')
      }

      apiKey = config.api_key
      groupId = groupId || config.group_id
    }

    // 调用 MiniMax API
    console.log('[v0] Calling MiniMax sync API...')
    const requestBody: any = {
      model: model || 'speech-2.8-hd',
      text,
      stream: false,
      voice_setting: {
        voice_id,
        speed: speed || 1.0,
        vol: vol !== undefined ? vol : 10,
        pitch: pitch || 1,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1,
      },
    }

    // 添加 GroupID（如果提供）
    if (groupId) {
      requestBody.GroupID = groupId
    }

    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[v0] MiniMax response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.base_resp?.status_msg || errorData.error || `HTTP ${response.status}`
      console.error('[v0] MiniMax error:', errorMsg)
      return ApiResponseHelper.serverError(`MiniMax API 错误: ${errorMsg}`)
    }

    const data = await response.json()

    // 解析响应
    if (!data.data?.audio) {
      console.error('[v0] No audio in response:', data)
      return ApiResponseHelper.serverError('MiniMax 响应中缺少音频数据')
    }

    // MiniMax 返回 base64 编码的音频
    const audioBase64 = data.data.audio
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    console.log('[v0] Audio buffer size:', audioBuffer.length, 'bytes')

    // 上传到 Vercel Blob
    try {
      const { put } = await import('@vercel/blob')
      const filename = `minimax-tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`
      
      console.log('[v0] Uploading to Vercel Blob...')
      const blob = await put(filename, audioBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
      })

      console.log('[v0] Uploaded to:', blob.url)

      // 返回 Blob URL，可直接在 audio 标签中使用
      return new NextResponse(
        JSON.stringify({
          success: true,
          code: 0,
          message: '语音合成成功',
          data: {
            audio_url: blob.url, // 直接返回可播放的 URL
            audio_time: data.data.audio_time || 0,
            status: 'success',
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } catch (uploadError) {
      console.error('[v0] Blob upload error:', uploadError)
      
      // 如果上传失败，返回 data URI（base64）
      const dataUri = `data:audio/mpeg;base64,${audioBase64}`
      console.log('[v0] Returning base64 data URI, length:', dataUri.length)
      
      return new NextResponse(
        JSON.stringify({
          success: true,
          code: 0,
          message: '语音合成成功（Base64 格式）',
          data: {
            audio_url: dataUri, // 返回可播放的 data URI
            audio_time: data.data.audio_time || 0,
            status: 'success',
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error) {
    console.error('[v0] Sync TTS error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '语音合成失败'
    )
  }
}
