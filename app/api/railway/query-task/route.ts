import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RailwayService } from '@/lib/services/railway-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const videoId = searchParams.get('videoId')
    
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

    // 如果基础视频正在处理，查询基础任务
    if (video.status === 'processing' && video.task_id) {
      const taskStatus = await RailwayService.queryTask(video.task_id)
      
      // 更新数据库状态
      if (taskStatus.status === 'completed' && taskStatus.video_url) {
        await supabase
          .from('videos')
          .update({
            status: 'completed',
            video_url: taskStatus.video_url,
            duration: 16,
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
        
        return NextResponse.json({
          status: 'completed',
          videoUrl: taskStatus.video_url,
          duration: 16,
        })
      } else if (taskStatus.status === 'failed') {
        await supabase
          .from('videos')
          .update({
            status: 'failed',
            error_message: taskStatus.error || 'Video generation failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
        
        return NextResponse.json({
          status: 'failed',
          error: taskStatus.error || 'Video generation failed',
        })
      }
      
      return NextResponse.json({
        status: 'processing',
        message: '视频正在生成中，请稍后查询',
      })
    }

    // 如果延长视频正在处理，查询延长任务
    if (video.extend_status === 'processing' && video.extend_task_id) {
      const taskStatus = await RailwayService.queryTask(video.extend_task_id)
      
      if (taskStatus.status === 'completed' && taskStatus.video_url) {
        await supabase
          .from('videos')
          .update({
            extend_status: 'completed',
            extended_video_url: taskStatus.video_url,
            extended_duration: 32,
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
        
        return NextResponse.json({
          status: 'completed',
          extendedVideoUrl: taskStatus.video_url,
          duration: 32,
        })
      } else if (taskStatus.status === 'failed') {
        await supabase
          .from('videos')
          .update({
            extend_status: 'failed',
            extend_error_message: taskStatus.error || 'Video extension failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
        
        return NextResponse.json({
          status: 'failed',
          error: taskStatus.error || 'Video extension failed',
        })
      }
      
      return NextResponse.json({
        status: 'processing',
        message: '视频延长正在处理中，请稍后查询',
      })
    }

    // 返回当前视频状态
    return NextResponse.json({
      status: video.extend_status === 'completed' ? 'completed' : video.status,
      videoUrl: video.video_url,
      extendedVideoUrl: video.extended_video_url,
      duration: video.extended_video_url ? video.extended_duration : video.duration,
    })

  } catch (error) {
    console.error('[v0] Railway query task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query task' },
      { status: 500 }
    )
  }
}
