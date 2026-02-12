import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    const { vercel_blob_token, provider } = await request.json()

    // 先禁用所有配置
    await supabase
      .from('storage_config')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // 更新或创建配置
    const { error } = await supabase
      .from('storage_config')
      .upsert({
        provider,
        vercel_blob_token,
        is_active: true,
      }, { onConflict: 'provider' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Storage config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
