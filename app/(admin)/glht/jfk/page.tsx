import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CardsPageClient } from './cards-page-client'

export default async function CardsManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) redirect('/wd')

  const [cardsResult, rechargeResult] = await Promise.all([
    supabase.from('starlight_cards').select('*').order('created_at', { ascending: false }).limit(100),
    supabase
      .from('starlight_recharge_records')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return <CardsPageClient initialCards={cardsResult.data || []} initialRecords={rechargeResult.data || []} />
}
