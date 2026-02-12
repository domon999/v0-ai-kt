'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  username: string | null
  user_group_id: string | null
  user_groups: { name: string } | null
  is_admin: boolean
  created_at: string
  credits?: number
}

interface UsersTableProps {
  users: User[]
  onEditUser: (user: User) => void
}

export function UsersTable({ users, onEditUser }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>用户组</TableHead>
              <TableHead>积分</TableHead>
              <TableHead>管理员</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>
                    {user.user_groups?.name || '普通用户'}
                  </TableCell>
                  <TableCell>{user.credits || 0}</TableCell>
                  <TableCell>
                    {user.is_admin ? (
                      <Badge>管理员</Badge>
                    ) : (
                      <Badge variant="outline">用户</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditUser(user)}
                    >
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        共 {filteredUsers.length} 个用户
      </div>
    </div>
  )
}
