import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BackgroundPageClient } from './background-page-client'

export default async function BackgroundPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/wd/bj')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const { data: backgrounds } = await supabase
    .from('backgrounds')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <BackgroundPageClient
      initialBackgrounds={backgrounds || []}
      isAdmin={profile?.is_admin || false}
    />
  )
}
