import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cardCode = searchParams.get('code')

    if (!cardCode) {
      return NextResponse.json({ success: false, error: '请提供卡密' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: card, error } = await supabase
      .from('starlight_cards')
      .select('card_code, points, status, prefix, created_at')
      .eq('card_code', cardCode.trim())
      .single()

    if (error || !card) {
      return NextResponse.json({ success: false, error: '星光卡不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      card: {
        cardCode: card.card_code,
        points: Number(card.points),
        status: card.status,
        isAvailable: card.status === 'available',
      },
    })
  } catch (error) {
    console.error('[v0] Query card exception:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
