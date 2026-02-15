import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MinimaxPageClient } from './minimax-page-client'

export default async function MinimaxPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/minimax')
  }

  // 获取用户的声音列表
  const { data: voices } = await supabase
    .from('voices')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return <MinimaxPageClient initialVoices={voices || []} />
}
