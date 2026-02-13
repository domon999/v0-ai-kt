import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreditService } from '@/lib/services/credit-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取请求参数
    const body = await request.json()
    const { amount, type, description, metadata } = body

    // 参数验证
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '扣减金额必须大于0' }, { status: 400 })
    }

    if (!type || !description) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 执行积分扣减
    const result = await CreditService.deductCredits({
      userId: user.id,
      amount: Number(amount),
      type,
      description,
      metadata,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '积分扣减失败' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      deducted: amount,
    })
  } catch (error) {
    console.error('[v0] Credits deduct API error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
