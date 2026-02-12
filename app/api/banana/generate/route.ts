import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BananaService } from '@/lib/services/banana-service'

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
    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    const requiredCredits = 200
    if (!credits || Number(credits.credits) < requiredCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Need 200 credits for image generation.' },
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
    const newBalance = Number(credits.credits) - requiredCredits
    await supabase
      .from('user_credits')
      .update({ credits: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    // Record usage
    await supabase.from('credit_usage_records').insert({
      user_id: user.id,
      type: '消费',
      amount: requiredCredits,
      balance_after: newBalance,
      description: '图生图 - 生成数字人形象',
    })

    return NextResponse.json({
      success: true,
      image_url: result.image_url,
      credits_used: requiredCredits,
      remaining_credits: newBalance,
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
