import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EnvVarsClient } from './env-vars-client'

export default async function EnvVarsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/glht/hjbl')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/wd')
  }

  return <EnvVarsClient />
}
