import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录状态
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    // 验证输入
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: '请提供旧密码和新密码' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '新密码长度至少6位' }, { status: 400 })
    }

    // 获取用户邮箱
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ success: false, error: '用户信息不完整' }, { status: 400 })
    }

    // 验证旧密码（尝试用旧密码登录）
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: oldPassword,
    })

    if (signInError) {
      return NextResponse.json({ success: false, error: '旧密码错误' }, { status: 400 })
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('[v0] Update password error:', updateError)
      return NextResponse.json(
        { success: false, error: '密码更新失败：' + updateError.message },
        { status: 500 },
      )
    }

    // 退出登录（让用户用新密码重新登录）
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: '密码修改成功，请重新登录',
    })
  } catch (error) {
    console.error('[v0] Change password error:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 },
    )
  }
}
