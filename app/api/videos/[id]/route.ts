import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id

    // 验证视频所有权
    const { data: video } = await supabase
      .from('videos')
      .select('user_id, video_url, extended_video_url')
      .eq('id', videoId)
      .single()

    if (!video || video.user_id !== user.id) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 删除视频文件（可选，取决于存储服务实现）
    // TODO: 调用 StorageService.deleteFile() 删除实际文件

    // 删除数据库记录
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete video error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    )
  }
}
