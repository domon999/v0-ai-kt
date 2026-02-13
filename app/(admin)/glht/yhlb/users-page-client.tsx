'use client'

import { useState } from 'react'
import { UsersTable } from '@/components/admin/users-table'
import { EditUserDialog } from '@/components/admin/edit-user-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

export function UsersPageClient({ users }: { users: User[] }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.user_groups?.name.toLowerCase().includes(query)
    )
  })

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleSaveUser = async (userId: string, updates: Partial<User>) => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }

    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">用户列表</h1>
        <p className="text-muted-foreground">管理所有注册用户</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索用户邮箱、用户名或用户组..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          共 {filteredUsers.length} 个用户
        </span>
      </div>

      {filteredUsers.length === 0 && searchQuery ? (
        <EmptyState
          icon={Search}
          title="未找到匹配的用户"
          description={`没有找到包含 "${searchQuery}" 的用户`}
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无用户"
          description="系统中还没有注册用户"
        />
      ) : (
        <UsersTable users={filteredUsers} onEditUser={handleEditUser} />
      )}

      <EditUserDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveUser}
      />
    </div>
  )
}
