import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'recharge' or 'usage'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    if (type === 'recharge') {
      const { data: records, error } = await supabase
        .from('recharge_records')
        .select('id, credits, card_code, payment_method, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[v0] Fetch recharge records error:', error)
        return NextResponse.json(
          { success: false, error: '获取充值记录失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, records: records || [] })
    }

    if (type === 'usage') {
      const { data: records, error } = await supabase
        .from('credit_usage_records')
        .select('id, type, amount, balance_after, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[v0] Fetch usage records error:', error)
        return NextResponse.json(
          { success: false, error: '获取消费记录失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, records: records || [] })
    }

    return NextResponse.json({ success: false, error: '无效的类型参数' }, { status: 400 })
  } catch (error) {
    console.error('[v0] History API exception:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
