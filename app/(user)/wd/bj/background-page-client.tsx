'use client'

import { useState } from 'react'
import { BackgroundGrid } from '@/components/wd/bj/background-grid'
import { UploadBackground } from '@/components/wd/bj/upload-background'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Background {
  id: string
  name: string
  image_url: string
  is_active: boolean
}

interface BackgroundPageClientProps {
  initialBackgrounds: Background[]
  isAdmin: boolean
}

export function BackgroundPageClient({
  initialBackgrounds,
  isAdmin,
}: BackgroundPageClientProps) {
  const [backgrounds, setBackgrounds] = useState(initialBackgrounds)

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/backgrounds/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBackgrounds(backgrounds.filter((bg) => bg.id !== id))
    }
  }

  const handleUploadSuccess = async () => {
    const res = await fetch('/api/backgrounds')
    const data = await res.json()
    setBackgrounds(data)
  }

  return (
    <div className="pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">背景管理</h1>
        <p className="text-muted-foreground">
          {isAdmin ? '管理系统背景图片' : '浏览可用背景图片'}
        </p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>上传新背景</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadBackground onUploadSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>
      )}

      <BackgroundGrid
        backgrounds={backgrounds}
        onDelete={isAdmin ? handleDelete : undefined}
        isAdmin={isAdmin}
      />
    </div>
  )
}
