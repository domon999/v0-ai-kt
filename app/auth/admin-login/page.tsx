'use client'

import type React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Captcha } from '@/components/captcha'
import { LoadingOverlay } from '@/components/loading-overlay'
import { ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'unauthorized') {
      setError('您没有管理员权限，请使用管理员账号登录')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!captchaValid) {
      setError('验证码错误，请重新输入')
      setCaptchaRefreshTrigger((prev) => prev + 1)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()

        if (!profile?.is_admin) {
          await supabase.auth.signOut()
          setError('您没有管理员权限，登录已取消')
          setIsLoading(false)
          setCaptchaRefreshTrigger((prev) => prev + 1)
          return
        }

        router.push('/glht/ybp')
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '登录失败')
      setCaptchaRefreshTrigger((prev) => prev + 1)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <LoadingOverlay isLoading={isLoading} message="验证管理员权限..." />

      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">管理员登录</CardTitle>
            <CardDescription className="text-center">
              仅限管理员访问
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">管理员邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="captcha">验证码</Label>
                  <Input
                    id="captcha"
                    type="text"
                    required
                    value={captchaValue}
                    onChange={(e) => setCaptchaValue(e.target.value)}
                    maxLength={4}
                    placeholder="输入验证码"
                  />
                  <Captcha
                    value={captchaValue}
                    onChange={setCaptchaValue}
                    onValidate={setCaptchaValid}
                    refreshTrigger={captchaRefreshTrigger}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '验证中...' : '管理员登录'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
