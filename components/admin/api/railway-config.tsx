'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export function RailwayConfig({ configs }: { configs: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Railway VEO 3.1 配置</h2>
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
                <Badge variant={config.is_active ? 'default' : 'secondary'}>
                  {config.is_active ? '激活' : '未激活'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{config.api_base_url}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
