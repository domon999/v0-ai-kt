'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'

export function BananaConfig({ configs }: { configs: any[] }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Banana API 配置</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加配置
        </Button>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{config.config_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? '激活' : '未激活'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm text-muted-foreground">Base URL</label>
                <p className="text-sm">{config.base_url}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">总请求: </span>
                  {config.total_requests}
                </div>
                <div>
                  <span className="text-muted-foreground">成功: </span>
                  {config.success_count}
                </div>
                <div>
                  <span className="text-muted-foreground">失败: </span>
                  {config.error_count}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
