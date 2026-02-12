'use client'

import { useEffect, useState } from 'react'
import { EnvStatusCard } from '@/components/admin/env/env-status-card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EnvStatus {
  database: any[]
  storage: any[]
  banana: any[]
  railway: any[]
  minimax: any[]
  dreamface: any[]
}

export function EnvVarsClient() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnvStatus()
  }, [])

  const fetchEnvStatus = async () => {
    try {
      const res = await fetch('/api/admin/env-status')
      const data = await res.json()
      setEnvStatus(data)
    } catch (error) {
      console.error('Failed to fetch env status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">加载中...</div>
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">环境变量</h1>
        <p className="text-muted-foreground mt-2">
          查看和管理所有服务的环境变量配置状态
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          环境变量在 Vercel 项目设置中配置。修改后需要重新部署才能生效。
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <EnvStatusCard
          title="数据库 (Supabase)"
          description="Supabase 数据库连接配置"
          variables={envStatus?.database || []}
        />
        
        <EnvStatusCard
          title="存储 (Vercel Blob)"
          description="文件存储服务配置"
          variables={envStatus?.storage || []}
        />
        
        <EnvStatusCard
          title="Banana API (图生图)"
          description="数字人图片生成服务"
          variables={envStatus?.banana || []}
        />
        
        <EnvStatusCard
          title="Railway (图生视频)"
          description="VEO 3.1 视频生成服务"
          variables={envStatus?.railway || []}
        />
        
        <EnvStatusCard
          title="MiniMax (声音克隆)"
          description="声音克隆和 TTS 服务"
          variables={envStatus?.minimax || []}
        />
        
        <EnvStatusCard
          title="DreamFace (唇同步)"
          description="视频唇形同步服务"
          variables={envStatus?.dreamface || []}
        />
      </div>
    </div>
  )
}
