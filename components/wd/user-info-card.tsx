'use client'

import { User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface UserInfoCardProps {
  email: string | null
  userGroup: string | null
  avatarUrl: string | null
}

export function UserInfoCard({ email, userGroup, avatarUrl }: UserInfoCardProps) {
  return (
    <Card className="mx-4 mt-4 overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              className="h-16 w-16 rounded-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <User className="h-8 w-8 text-primary" />
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col gap-1 overflow-hidden">
          <p className="truncate text-base font-semibold text-foreground">
            {email || '未设置邮箱'}
          </p>
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {userGroup || '普通用户'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
