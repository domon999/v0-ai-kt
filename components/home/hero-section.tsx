import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo and brand */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">客小兔</h2>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            AI 驱动的数字人
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              口播视频平台
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            让创意轻松变为现实，一键生成专业口播视频。强大的 AI 技术，让每个人都能拥有自己的数字分身。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoggedIn ? (
              <Button size="lg" className="min-w-[160px]" asChild>
                <Link href="/wd">进入工作台</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="min-w-[160px]" asChild>
                  <Link href="/auth/sign-up">立即开始</Link>
                </Button>
                <Button size="lg" variant="outline" className="min-w-[160px] bg-transparent" asChild>
                  <Link href="/auth/login">登录</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
