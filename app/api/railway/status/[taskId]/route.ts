import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRailwayService } from '@/lib/services/railway-service'
import { ApiResponseHelper } from '@/lib/utils/api-response'

export const runtime = 'nodejs'

/**
 * GET /api/railway/status/:taskId
 * 
 * 查询视频生成/延长任务状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { taskId } = params

    if (!taskId) {
      return ApiResponseHelper.validationError('缺少任务ID')
    }

    // 查询任务状态
    const railwayService = await getRailwayService()
    const status = await railwayService.getTaskStatus(taskId)

    // 如果任务完成，更新数据库记录
    if (status.status === 'completed' && status.videoUrl) {
      await supabase
        .from('videos')
        .update({
          status: 'completed',
          video_url: status.videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
    } else if (status.status === 'failed') {
      await supabase
        .from('videos')
        .update({
          status: 'failed',
          error_message: status.error,
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
    } else if (status.status === 'processing') {
      await supabase
        .from('videos')
        .update({
          status: 'processing',
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
    }

    return ApiResponseHelper.success({
      taskId,
      status: status.status,
      videoUrl: status.videoUrl,
      error: status.error,
      progress: status.progress,
    })
  } catch (error) {
    console.error('[v0] Railway status error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '查询任务状态失败'
    )
  }
}
