import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserInfoCard } from '@/components/wd/user-info-card'
import { CreditsDisplay } from '@/components/wd/credits-display'
import { MenuGrid } from '@/components/wd/menu-grid'

export default async function PersonalCenterPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/wd')
  }

  // 并行获取 profile 和积分数据
  const [profileResult, creditsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, username, avatar_url, user_group_id, user_groups(name)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_credits')
      .select('credits, total_credits')
      .eq('user_id', user.id)
      .single(),
  ])

  const profile = profileResult.data
  const credits = creditsResult.data

  return (
    <div className="pb-20">
      {/* 用户信息卡片 */}
      <UserInfoCard
        email={profile?.email || user.email || null}
        userGroup={(profile?.user_groups as { name: string } | null)?.name || null}
        avatarUrl={profile?.avatar_url || null}
      />

      {/* 积分余额 */}
      <CreditsDisplay
        credits={credits?.credits ? Number(credits.credits) : 0}
        totalCredits={credits?.total_credits ? Number(credits.total_credits) : 0}
      />

      {/* 功能菜单 */}
      <MenuGrid />
    </div>
  )
}
