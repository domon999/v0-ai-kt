import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApiManagementClient } from './api-management-client'

export default async function ApiManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  const [bananaConfigs, railwayConfigs, minimaxConfigs, dreamfaceConfigs] = await Promise.all([
    supabase.from('banana_config').select('*').order('priority'),
    supabase.from('railway_config').select('*').order('priority'),
    supabase.from('minimax_voice_configs').select('*').order('priority'),
    supabase.from('dreamface_config').select('*'),
  ])

  return (
    <ApiManagementClient
      bananaConfigs={bananaConfigs.data || []}
      railwayConfigs={railwayConfigs.data || []}
      minimaxConfigs={minimaxConfigs.data || []}
      dreamfaceConfigs={dreamfaceConfigs.data || []}
    />
  )
}
