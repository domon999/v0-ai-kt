import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordsPageClient } from './records-page-client'

export default async function SynthesisRecordsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/glht/hcjl')
  }

  // Check admin permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/wd')
  }

  // Fetch all records in parallel
  const [digitalHumansResult, videosResult, voicesResult] = await Promise.all([
    supabase
      .from('digital_humans')
      .select(`
        *,
        profiles!digital_humans_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('videos')
      .select(`
        *,
        profiles!videos_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('voices')
      .select(`
        *,
        profiles!voices_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const digitalHumans = (digitalHumansResult.data || []).map((record) => ({
    ...record,
    user_email: record.profiles?.email || '未知',
  }))

  const videos = (videosResult.data || []).map((record) => ({
    ...record,
    user_email: record.profiles?.email || '未知',
  }))

  const voices = (voicesResult.data || []).map((record) => ({
    ...record,
    user_email: record.profiles?.email || '未知',
  }))

  return <RecordsPageClient digitalHumans={digitalHumans} videos={videos} voices={voices} />
}
