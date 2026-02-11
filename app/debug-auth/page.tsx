'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setAuthInfo({
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
      })
    } else {
      setAuthInfo({ user: null, profile: null })
    }
    
    setLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">加载中...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>认证信息调试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">用户信息：</h3>
            <pre className="rounded bg-muted p-4 text-xs">
              {JSON.stringify(authInfo?.user, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="mb-2 font-semibold">Profile 信息：</h3>
            <pre className="rounded bg-muted p-4 text-xs">
              {JSON.stringify(authInfo?.profile, null, 2)}
            </pre>
          </div>

          {authInfo?.profile?.is_admin && (
            <div className="rounded-lg bg-green-100 p-4 text-green-800">
              ✓ 此账号拥有管理员权限
            </div>
          )}

          {authInfo?.user && !authInfo?.profile?.is_admin && (
            <div className="rounded-lg bg-yellow-100 p-4 text-yellow-800">
              ⚠ 此账号没有管理员权限
            </div>
          )}

          {authInfo?.user && (
            <Button onClick={handleSignOut} variant="destructive">
              退出登录
            </Button>
          )}

          {!authInfo?.user && (
            <div className="text-muted-foreground">
              未登录，请先<a href="/auth/login" className="text-primary underline">登录</a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
