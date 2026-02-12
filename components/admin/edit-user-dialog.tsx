'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface User {
  id: string
  email: string
  username: string | null
  user_group_id: string | null
  is_admin: boolean
  credits?: number
}

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (userId: string, updates: Partial<User>) => Promise<void>
}

export function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [username, setUsername] = useState(user?.username || '')
  const [credits, setCredits] = useState(user?.credits?.toString() || '0')
  const [isAdmin, setIsAdmin] = useState(user?.is_admin || false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      await onSave(user.id, {
        username: username || null,
        is_admin: isAdmin,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>修改用户信息和权限</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>邮箱</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
            />
          </div>

          <div>
            <Label htmlFor="credits">积分余额</Label>
            <Input
              id="credits"
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              disabled
              className="bg-muted"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              积分修改请使用积分管理页面
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
            />
            <Label htmlFor="isAdmin" className="cursor-pointer">
              设置为管理员
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
