import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const checkEnv = (name: string, required: boolean = true) => ({
    name,
    value: process.env[name] ? '已设置' : undefined,
    required,
    masked: true,
  })

  const envStatus = {
    database: [
      checkEnv('NEXT_PUBLIC_SUPABASE_URL'),
      checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      checkEnv('SUPABASE_SERVICE_ROLE_KEY'),
    ],
    storage: [
      checkEnv('BLOB_READ_WRITE_TOKEN', false),
    ],
    banana: [],
    railway: [],
    minimax: [],
    dreamface: [],
  }

  return NextResponse.json(envStatus)
}
