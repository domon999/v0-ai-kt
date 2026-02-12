'use client'

import { useState } from 'react'
import { WorkCard } from '@/components/wd/zp/work-card'

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

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/works/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error('删除失败')
    }

    setWorks(works.filter((w) => w.id !== id))
  }

  if (works.length === 0) {
    return (
      <div className="pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">我的作品</h1>
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无作品</p>
            <p className="text-sm mt-2">完成唇同步后的作品会显示在这里</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">我的作品</h1>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  )
}
