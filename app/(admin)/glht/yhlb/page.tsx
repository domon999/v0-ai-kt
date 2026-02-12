import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersPageClient } from './users-page-client'

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/admin-login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // 获取所有用户及其积分信息
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      username,
      user_group_id,
      user_groups(name),
      is_admin,
      created_at
    `)
    .order('created_at', { ascending: false })

  // 获取所有用户积分
  const { data: credits } = await supabase.from('user_credits').select('user_id, credits')

  const usersWithCredits = users?.map((user) => ({
    ...user,
    credits: credits?.find((c) => c.user_id === user.id)?.credits || 0,
  }))

  return <UsersPageClient users={usersWithCredits || []} />
}
