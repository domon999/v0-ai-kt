import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RailwayService } from '@/lib/services/railway-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl } = await request.json()
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // 检查积分余额
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.credits < 200) {
      return NextResponse.json({ error: '积分不足，需要200积分' }, { status: 400 })
    }

    // 调用 Railway API 生成视频
    const { taskId } = await RailwayService.generateVideo(imageUrl)

    // 扣除积分
    const newBalance = Number(credits.credits) - 200
    await supabase
      .from('user_credits')
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    // 记录消费
    await supabase.from('credit_usage_records').insert({
      user_id: user.id,
      type: '消费',
      amount: -200,
      balance_after: newBalance,
      description: '图生视频（16秒）',
    })

    // 创建视频记录
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        source_image_url: imageUrl,
        task_id: taskId,
        status: 'processing',
        credits_used: 200,
      })
      .select()
      .single()

    if (videoError) throw videoError

    return NextResponse.json({ 
      success: true, 
      videoId: video.id,
      taskId,
      message: '视频生成任务已提交，请等待处理完成'
    })

  } catch (error) {
    console.error('[v0] Railway generate video error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    )
  }
}
