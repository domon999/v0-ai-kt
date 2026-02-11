import React from "react"
import { BottomNav } from '@/components/bottom-nav'
import { SidebarMenu } from '@/components/sidebar-menu'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">客小兔</span>
          </Link>
          <SidebarMenu />
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 pb-16">{children}</main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}
