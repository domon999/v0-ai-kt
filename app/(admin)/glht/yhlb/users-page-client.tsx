'use client'

import { useState } from 'react'
import { UsersTable } from '@/components/admin/users-table'
import { EditUserDialog } from '@/components/admin/edit-user-dialog'
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
  const router = useRouter()

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

      <UsersTable users={users} onEditUser={handleEditUser} />

      <EditUserDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveUser}
      />
    </div>
  )
}
