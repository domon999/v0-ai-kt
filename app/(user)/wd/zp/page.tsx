import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorksPageClient } from './works-page-client'

export default async function WorksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/wd/zp')
  }

  const { data: works } = await supabase
    .from('works')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <WorksPageClient initialWorks={works || []} />
}
