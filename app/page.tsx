import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Video, Mic, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 头部导航 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">客小兔</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/sign-up">注册</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/login">登录</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            AI 口播数字人平台
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            让您的创意轻松变为现实，一键生成专业口播视频
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">立即开始</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">登录账号</Link>
            </Button>
          </div>
        </section>

        {/* 功能介绍 */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold">核心功能</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">数字人克隆</h3>
                <p className="text-muted-foreground">
                  上传照片即可生成专属数字人形象，支持自定义背景和动作
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">声音克隆</h3>
                <p className="text-muted-foreground">
                  高质量声音克隆技术，让数字人使用您的专属声音进行口播
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">快速生成</h3>
                <p className="text-muted-foreground">
                  AI 驱动的快速渲染，几分钟内即可生成高质量口播视频
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-lg bg-primary/5 p-8 text-center md:p-12">
          <h2 className="mb-4 text-3xl font-bold">准备好开始了吗？</h2>
          <p className="mb-6 text-muted-foreground">
            注册账号，立即体验 AI 口播数字人的强大功能
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">免费注册</Link>
          </Button>
        </section>
      </main>

      {/* 底部 */}
      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 客小兔 AI 口播数字人平台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
