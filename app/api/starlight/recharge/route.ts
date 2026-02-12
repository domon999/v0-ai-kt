import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 获取请求体
    const body = await request.json()
    const { cardCode } = body

    if (!cardCode || typeof cardCode !== 'string') {
      return NextResponse.json({ success: false, error: '无效的卡密' }, { status: 400 })
    }

    // 调用数据库函数进行充值
    const { data: result, error } = await supabase.rpc('recharge_with_card', {
      p_card_code: cardCode.trim(),
      p_user_id: user.id,
    })

    if (error) {
      console.error('[v0] Recharge error:', error)
      return NextResponse.json(
        { success: false, error: error.message || '充值失败' },
        { status: 500 }
      )
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, error: result?.error || '充值失败' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      points: result.points,
      newBalance: result.new_balance,
      message: result.message,
    })
  } catch (error) {
    console.error('[v0] Recharge exception:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
