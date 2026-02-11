'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">验证您的邮箱</CardTitle>
            <CardDescription>
              我们已向您的邮箱发送了一封验证邮件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm">
            <p className="text-muted-foreground">
              请检查您的收件箱，点击邮件中的验证链接以完成注册。
            </p>
            <p className="text-muted-foreground">
              如果您没有收到邮件，请检查垃圾邮件文件夹。
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
