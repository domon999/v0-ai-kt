'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Film, Mic, ImageIcon, Coins, KeyRound, LogOut } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function MenuGrid() {
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const menuItems = [
    {
      label: '我的作品',
      icon: Film,
      href: '/wd/zp',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: '我的声音',
      icon: Mic,
      href: '/wd/sy',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: '我的背景',
      icon: ImageIcon,
      href: '/wd/bj',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: '积分管理',
      icon: Coins,
      href: '/wd/jf',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: '修改密码',
      icon: KeyRound,
      href: '#password',
      color: 'text-slate-500',
      bg: 'bg-slate-500/10',
    },
    {
      label: '退出登录',
      icon: LogOut,
      href: '#logout',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ]

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/home')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutDialog(false)
    }
  }

  function handleMenuClick(href: string) {
    if (href === '#logout') {
      setShowLogoutDialog(true)
    } else if (href === '#password') {
      setShowPasswordDialog(true)
    } else {
      router.push(href)
    }
  }

  return (
    <>
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <Card
            key={item.label}
            className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
            onClick={() => handleMenuClick(item.href)}
          >
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出</AlertDialogTitle>
            <AlertDialogDescription>
              确定要退出登录吗？退出后需要重新登录才能使用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? '退出中...' : '确认退出'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>修改密码</AlertDialogTitle>
            <AlertDialogDescription>
              系统将向您的注册邮箱发送密码重置链接，请前往邮箱完成密码修改。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowPasswordDialog(false)
                router.push('/auth/reset-password')
              }}
            >
              前往修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
