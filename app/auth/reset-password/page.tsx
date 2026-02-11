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
import { useState } from 'react'
import { LoadingOverlay } from '@/components/loading-overlay'
import { KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error

      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '发送失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">邮件已发送</CardTitle>
              <CardDescription>
                请检查您的邮箱以重置密码
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center text-sm">
              <p className="text-muted-foreground">
                我们已向 <strong>{email}</strong> 发送了密码重置链接。
              </p>
              <p className="text-muted-foreground">
                请点击邮件中的链接以重置您的密码。
              </p>
              <div className="pt-4">
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/auth/login">返回登录</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <LoadingOverlay isLoading={isLoading} message="发送重置邮件..." />

      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">重置密码</CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将向您发送密码重置链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
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

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '发送中...' : '发送重置链接'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  返回登录
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
