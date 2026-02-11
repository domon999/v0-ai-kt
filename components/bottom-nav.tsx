'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Video, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: '首页',
      href: '/home',
      icon: Home,
      isActive: pathname === '/home',
    },
    {
      label: '克隆',
      href: '/rw',
      icon: Video,
      isActive: pathname.startsWith('/rw'),
    },
    {
      label: '我的',
      href: '/wd',
      icon: User,
      isActive: pathname.startsWith('/wd'),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                item.isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
