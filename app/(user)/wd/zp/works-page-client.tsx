'use client'

import { useState } from 'react'
import { WorkCard } from '@/components/wd/zp/work-card'
import { BackButton } from '@/components/wd/back-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Film, Search } from 'lucide-react'

interface Work {
  id: string
  title: string
  final_video_url: string
  total_credits_used: number
  created_at: string
}

interface WorksPageClientProps {
  initialWorks: Work[]
}

export function WorksPageClient({ initialWorks }: WorksPageClientProps) {
  const [works, setWorks] = useState<Work[]>(initialWorks)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWorks = works.filter((work) => {
    const query = searchQuery.toLowerCase()
    return work.title?.toLowerCase().includes(query)
  })

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/works/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error('删除失败')
    }

    setWorks(works.filter((w) => w.id !== id))
  }

  return (
    <div className="space-y-6 pb-20">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold">我的作品</h1>
        <p className="text-muted-foreground">查看和管理您的所有作品</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索作品标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          共 {filteredWorks.length} 个作品
        </span>
      </div>

      {filteredWorks.length === 0 && searchQuery ? (
        <EmptyState
          icon={Search}
          title="未找到匹配的作品"
          description={`没有找到包含 "${searchQuery}" 的作品`}
        />
      ) : filteredWorks.length === 0 ? (
        <EmptyState
          icon={Film}
          title="还没有作品"
          description="完成口播合成后的作品会显示在这里"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorks.map((work) => (
            <WorkCard key={work.id} work={work} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
