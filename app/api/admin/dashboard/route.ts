import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    todayUsers,
    totalCredits,
    totalVideos,
    totalVoices,
    totalWorks,
    recentRecharges,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    supabase.from('user_credits').select('credits'),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('voices').select('*', { count: 'exact', head: true }),
    supabase.from('works').select('*', { count: 'exact', head: true }),
    supabase
      .from('recharge_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalCreditsSum =
    totalCredits.data?.reduce((sum, item) => sum + Number(item.credits || 0), 0) || 0

  return NextResponse.json({
    users: {
      total: totalUsers.count || 0,
      today: todayUsers.count || 0,
    },
    credits: {
      total: totalCreditsSum,
    },
    videos: {
      total: totalVideos.count || 0,
    },
    voices: {
      total: totalVoices.count || 0,
    },
    works: {
      total: totalWorks.count || 0,
    },
    recentRecharges: recentRecharges.data || [],
  })
}
