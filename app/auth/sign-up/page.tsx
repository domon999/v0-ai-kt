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

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)
  const [captchaRefreshTrigger, setCaptchaRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setError(null)

    if (!captchaValid) {
      setError('验证码错误，请重新输入')
      setIsLoading(false)
      setCaptchaRefreshTrigger((prev) => prev + 1)
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      setCaptchaRefreshTrigger((prev) => prev + 1)
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为6位')
      setIsLoading(false)
      setCaptchaRefreshTrigger((prev) => prev + 1)
      return
    }

    const supabase = createClient()

    try {
      const redirectUrl = searchParams.get('redirect') || '/wd'
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login?message=${encodeURIComponent('邮箱验证成功，请登录')}&redirect=${encodeURIComponent(redirectUrl)}`,
        },
      })
      if (error) throw error

      router.push('/auth/verify-email')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '注册失败，请重试')
      setCaptchaRefreshTrigger((prev) => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <LoadingOverlay isLoading={isLoading} message="注册中，请稍候..." />

      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">注册</CardTitle>
            <CardDescription>创建您的账号</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
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
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                已有账号？{' '}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  立即登录
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
