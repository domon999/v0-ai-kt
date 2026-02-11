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
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Captcha } from '@/components/captcha'
import { LoadingOverlay } from '@/components/loading-overlay'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirect = searchParams.get('redirect')

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

        if (redirect) {
          router.push(redirect)
        } else if (profile?.is_admin) {
          router.push('/glht/ybp')
        } else {
          router.push('/wd')
        }
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '登录失败')
      setCaptchaRefreshTrigger((prev) => prev + 1)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <LoadingOverlay isLoading={isLoading} message="登录中，请稍候..." />

      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">登录</CardTitle>
            <CardDescription>输入您的邮箱和密码登录账号</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
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
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                还没有账号？{' '}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  立即注册
                </Link>
                {' · '}
                <Link
                  href="/auth/reset-password"
                  className="underline underline-offset-4"
                >
                  忘记密码
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
