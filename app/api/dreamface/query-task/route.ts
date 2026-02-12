import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DreamFaceService } from '@/lib/services/dreamface-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const { data: syncTask } = await supabase
      .from('sync_tasks')
      .select('*, dreamface_config:dreamface_config!inner(*)')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (!syncTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (syncTask.status === 'completed' || syncTask.status === 'failed') {
      return NextResponse.json({
        status: syncTask.status,
        outputVideoUrl: syncTask.output_video_url,
        errorMessage: syncTask.error_message,
      })
    }

    if (!syncTask.task_id) {
      return NextResponse.json({ status: 'pending' })
    }

    const configId = (syncTask as any).dreamface_config?.id
    const result = await DreamFaceService.queryTask(syncTask.task_id, configId)

    if (result.status === 'completed' && result.output_url) {
      await supabase
        .from('sync_tasks')
        .update({
          status: 'completed',
          output_video_url: result.output_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      return NextResponse.json({
        status: 'completed',
        outputVideoUrl: result.output_url,
      })
    } else if (result.status === 'failed') {
      await supabase
        .from('sync_tasks')
        .update({
          status: 'failed',
          error_message: result.error || 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      return NextResponse.json({
        status: 'failed',
        errorMessage: result.error || 'Unknown error',
      })
    }

    return NextResponse.json({ status: 'processing' })
  } catch (error: any) {
    console.error('[v0] DreamFace query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
