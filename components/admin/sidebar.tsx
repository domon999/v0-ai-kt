'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Image as ImageIcon,
  Cloud,
  FileText,
  UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: LayoutDashboard, label: '仪表盘', href: '/glht/ybp' },
  { icon: Users, label: '用户列表', href: '/glht/yhlb' },
  { icon: CreditCard, label: '积分卡管理', href: '/glht/jfk' },
  { icon: Settings, label: 'API 管理', href: '/glht/api' },
  { icon: ImageIcon, label: '背景图片', href: '/glht/bjtp' },
  { icon: Cloud, label: '七牛云管理', href: '/glht/qny' },
  { icon: FileText, label: '合成记录', href: '/glht/hcjl' },
  { icon: UserCog, label: '代理商管理', href: '/glht/dls' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">客小兔 · 管理后台</h1>
      </div>
      
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
