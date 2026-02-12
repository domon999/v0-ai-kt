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

    const { videoId } = await request.json()
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // 获取视频记录
    const { data: video } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.status !== 'completed' || !video.video_url) {
      return NextResponse.json({ error: '视频尚未生成完成，无法延长' }, { status: 400 })
    }

    if (video.extend_status === 'completed') {
      return NextResponse.json({ error: '视频已经延长过了' }, { status: 400 })
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

    // 调用 Railway API 延长视频
    const { taskId } = await RailwayService.extendVideo(video.video_url)

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
      description: '视频延长（16秒 → 32秒）',
    })

    // 更新视频记录
    await supabase
      .from('videos')
      .update({
        extend_task_id: taskId,
        extend_status: 'processing',
        extend_credits_used: 200,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)

    return NextResponse.json({ 
      success: true, 
      extendTaskId: taskId,
      message: '视频延长任务已提交，请等待处理完成'
    })

  } catch (error) {
    console.error('[v0] Railway extend video error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extend video' },
      { status: 500 }
    )
  }
}
