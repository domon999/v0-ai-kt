import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { prefix, points, quantity } = await request.json()

  const cards = Array.from({ length: quantity }, () => ({
    card_code: `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    points,
    status: 'available',
    prefix,
  }))

  const { error } = await supabase.from('starlight_cards').insert(cards)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: quantity })
}
