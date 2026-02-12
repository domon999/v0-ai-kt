import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DreamFaceService } from '@/lib/services/dreamface-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl, audioUrl, videoId } = await request.json()

    if (!videoUrl || !audioUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (!credits || Number(credits.credits) < 50) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    const { taskId, config } = await DreamFaceService.syncLips(videoUrl, audioUrl)

    const { data: syncTask, error: insertError } = await supabase
      .from('sync_tasks')
      .insert({
        user_id: user.id,
        video_id: videoId || null,
        input_video_url: videoUrl,
        input_audio_url: audioUrl,
        task_id: taskId,
        status: 'processing',
        credits_used: 50,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await supabase.rpc('consume_credits', {
      p_user_id: user.id,
      p_amount: 50,
      p_type: '唇同步',
      p_description: '视频唇同步处理',
    })

    return NextResponse.json({
      success: true,
      taskId: syncTask.id,
      dreamfaceTaskId: taskId,
      message: '唇同步任务已创建，消耗 50 积分',
    })
  } catch (error: any) {
    console.error('[v0] DreamFace sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
