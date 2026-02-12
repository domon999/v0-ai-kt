import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClonePageClient } from './clone-page-client'

export default async function ClonePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/rw')
  }

  // 获取用户的视频列表
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ClonePageClient initialVideos={videos || []} />
}
