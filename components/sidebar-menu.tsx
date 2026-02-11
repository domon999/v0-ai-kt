'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, UserPlus, LogIn, Briefcase, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function SidebarMenu() {
  const [open, setOpen] = useState(false)

  const menuItems = [
    {
      label: '注册账号',
      href: '/auth/sign-up',
      icon: UserPlus,
      description: '创建新账号开始使用',
    },
    {
      label: '登录账号',
      href: '/auth/login',
      icon: LogIn,
      description: '已有账号直接登录',
    },
    {
      label: '做代理',
      href: '/wd/dl',
      icon: Briefcase,
      description: '成为代理商获得优惠',
    },
    {
      label: '联系开发者',
      href: 'mailto:support@kexiaotu.com',
      icon: Mail,
      description: '获取技术支持',
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>快捷菜单</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
