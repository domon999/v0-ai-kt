import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: voices, error } = await supabase
      .from('voices')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ voices })
  } catch (error) {
    console.error('[v0] Get voices error:', error)
    return NextResponse.json(
      { error: '获取声音列表失败' },
      { status: 500 }
    )
  }
}
