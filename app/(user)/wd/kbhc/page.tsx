import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SynthesisPageClient } from './synthesis-page-client'

export default async function SynthesisPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/wd/kbhc')
  }

  return <SynthesisPageClient />
}
