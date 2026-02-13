'use client'

import { useState } from 'react'
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
  UserCog,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: LayoutDashboard, label: '仪表盘', href: '/glht/ybp' },
  { icon: Users, label: '用户列表', href: '/glht/yhlb' },
  { icon: CreditCard, label: '积分卡管理', href: '/glht/jfk' },
  { icon: Settings, label: 'API 管理', href: '/glht/api' },
  { icon: ImageIcon, label: '背景图片', href: '/glht/bjtp' },
  { icon: Cloud, label: '存储管理', href: '/glht/cc' },
  { icon: FileText, label: '合成记录', href: '/glht/hcjl' },
  { icon: UserCog, label: '环境变量', href: '/glht/hjbl' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* 移动端遮罩 */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 侧边栏 */}
      <aside 
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
          isCollapsed ? '-translate-x-full w-0' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <h1 className="text-lg font-bold">客小兔管理后台</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <nav className="space-y-1 p-2">
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
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 占位元素 */}
      <div className={cn('transition-all duration-300', isCollapsed ? 'w-0' : 'w-64')} />
      
      {/* 浮动展开按钮 */}
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="fixed left-4 top-4 z-50 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}
