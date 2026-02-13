import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreditService } from '@/lib/services/credit-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const requiredAmount = searchParams.get('amount')

    if (!requiredAmount || Number(requiredAmount) <= 0) {
      return NextResponse.json({ error: '无效的金额参数' }, { status: 400 })
    }

    // 获取用户当前积分
    const currentCredits = await CreditService.getUserCredits(user.id)

    // 检查是否充足
    const isSufficient = currentCredits >= Number(requiredAmount)

    return NextResponse.json({
      success: true,
      currentCredits,
      requiredAmount: Number(requiredAmount),
      isSufficient,
      shortage: isSufficient ? 0 : Number(requiredAmount) - currentCredits,
    })
  } catch (error) {
    console.error('[v0] Credits check API error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
