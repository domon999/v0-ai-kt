'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DreamFaceConfig({ configs }: { configs: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">DreamFace 唇同步配置</h2>

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
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{config.api_base_url}</p>
              <div className="text-sm">
                <span className="text-muted-foreground">Token 数量: </span>
                {config.tokens?.length || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
