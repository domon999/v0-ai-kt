import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { file_id, voice_id, clone_prompt, text, model } = body

    if (!file_id || !voice_id) {
      return NextResponse.json({ error: '缺少必填参数' }, { status: 400 })
    }

    console.log('[v0] 音色复刻:', { file_id, voice_id, hasPrompt: !!clone_prompt })

    // 构建请求体
    const requestBody: any = {
      file_id,
      voice_id,
    }

    // 添加可选的 clone_prompt
    if (clone_prompt && (clone_prompt.prompt_audio || clone_prompt.prompt_text)) {
      requestBody.clone_prompt = {}
      if (clone_prompt.prompt_audio) {
        requestBody.clone_prompt.prompt_audio = clone_prompt.prompt_audio
      }
      if (clone_prompt.prompt_text) {
        requestBody.clone_prompt.prompt_text = clone_prompt.prompt_text
      }
    }

    // 调用 MiniMax 音色复刻 API
    const cloneResponse = await fetch('https://api.minimaxi.com/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const cloneData = await cloneResponse.json()

    if (!cloneResponse.ok || cloneData.base_resp?.status_code !== 0) {
      console.error('[v0] MiniMax 复刻 API 错误:', cloneData)
      return NextResponse.json(
        { error: cloneData.base_resp?.status_msg || '音色复刻失败' },
        { status: cloneResponse.status }
      )
    }

    // 如果提供了试听文本，生成试听音频
    let audioUrl = null
    if (text) {
      console.log('[v0] 生成试听音频...')
      
      const ttsResponse = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'speech-2.8-hd',
          text,
          voice_id,
          audio_sample_rate: 32000,
          bitrate: 128000,
        }),
      })

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer()
        const base64Audio = Buffer.from(audioBuffer).toString('base64')
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`
      }
    }

    return NextResponse.json({
      voice_id,
      audio_file: audioUrl,
      message: '音色复刻成功',
    })
  } catch (error) {
    console.error('[v0] 音色复刻错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
