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
    const { model, text, voice_id, speed, vol, pitch } = body

    if (!text || !voice_id) {
      return NextResponse.json({ error: '缺少必填参数' }, { status: 400 })
    }

    console.log('[v0] 同步语音合成:', { model, voice_id, textLength: text.length })

    // 调用 MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'speech-2.6-turbo',
        text,
        voice_id,
        speed: speed || 1.0,
        vol: vol || 1.0,
        pitch: pitch || 0,
        audio_sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] MiniMax API 错误:', error)
      return NextResponse.json(
        { error: error.base_resp?.status_msg || '语音合成失败' },
        { status: response.status }
      )
    }

    // MiniMax API 返回 JSON 格式，包含 base64 编码的音频
    const data = await response.json()
    
    console.log('[v0] === MiniMax 响应 ===')
    console.log('[v0] 状态码:', data.base_resp?.status_code)
    console.log('[v0] 响应keys:', Object.keys(data))
    console.log('[v0] data keys:', data.data ? Object.keys(data.data) : 'no data')
    
    // 检查 API 是否成功
    if (data.base_resp?.status_code !== 0) {
      console.error('[v0] API返回错误:', data.base_resp?.status_msg)
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || 'API返回错误'
      }, { status: 400 })
    }

    // 尝试多种可能的音频数据路径
    const audioData = data.data?.audio || data.audio || data.data?.extra_audio_parts?.[0]?.audio
    
    if (!audioData) {
      console.error('[v0] 未找到音频数据')
      console.error('[v0] 完整响应:', JSON.stringify(data, null, 2).substring(0, 500))
      return NextResponse.json({ 
        error: '未返回音频数据，请检查API响应格式',
        responseKeys: Object.keys(data),
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : []
      }, { status: 500 })
    }

    console.log('[v0] 找到音频数据，长度:', audioData.length)

    // 解码 Base64 音频数据
    const audioBuffer = Buffer.from(audioData, 'base64')
    console.log('[v0] 音频buffer大小:', audioBuffer.length, 'bytes')

    // 返回音频流（不存储到 blob）
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="tts-audio.mp3"',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[v0] 同步合成错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
