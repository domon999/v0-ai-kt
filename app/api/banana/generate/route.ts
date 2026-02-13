import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BananaService } from '@/lib/services/banana-service'
import { CreditService } from '@/lib/services/credit-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image_url, prompt } = body

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 },
      )
    }

    // Check user credits
    const requiredCredits = 200
    const hasEnough = await CreditService.checkBalance(user.id, requiredCredits)
    
    if (!hasEnough) {
      return NextResponse.json(
        { error: `积分不足，需要 ${requiredCredits} 积分` },
        { status: 402 },
      )
    }

    // Call Banana API
    const bananaService = new BananaService()
    const result = await bananaService.generateDigitalHuman(image_url, prompt)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate digital human' },
        { status: 500 },
      )
    }

    // Deduct credits
    const deductResult = await CreditService.deduct(
      user.id,
      requiredCredits,
      'digital_human',
      '数字人生成'
    )

    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.error || '积分扣减失败' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      image_url: result.image_url,
      credits_used: requiredCredits,
      remaining_credits: deductResult.newBalance,
    })
  } catch (error) {
    console.error('[v0] Banana API error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}
