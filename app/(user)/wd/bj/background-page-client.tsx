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
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const filteredBackgrounds = initialBackgrounds.filter((bg) => {
    const query = searchQuery.toLowerCase()
    return bg.name?.toLowerCase().includes(query) || bg.description?.toLowerCase().includes(query)
  })

  const handleUploadSuccess = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">背景管理</h1>
          <p className="text-muted-foreground">
            {isAdmin ? '管理系统背景图片库' : '浏览可用的背景图片'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            上传背景
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索背景名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          共 {filteredBackgrounds.length} 张背景
        </span>
      </div>

      {filteredBackgrounds.length === 0 && searchQuery ? (
        <EmptyState
          icon={Search}
          title="未找到匹配的背景"
          description={`没有找到包含 "${searchQuery}" 的背景`}
        />
      ) : filteredBackgrounds.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="还没有背景图片"
          description={isAdmin ? '上传第一张背景图片到系统库' : '系统中暂无可用背景'}
          action={
            isAdmin ? (
              <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                上传第一张背景
              </Button>
            ) : undefined
          }
        />
      ) : (
        <BackgroundGrid backgrounds={filteredBackgrounds} isAdmin={isAdmin} />
      )}

      {isAdmin && (
        <BackgroundUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
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
