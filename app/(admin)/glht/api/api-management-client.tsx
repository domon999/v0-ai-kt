'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BananaConfig } from '@/components/admin/api/banana-config'
import { RailwayConfig } from '@/components/admin/api/railway-config'
import { MinimaxConfig } from '@/components/admin/api/minimax-config'
import { DreamFaceConfig } from '@/components/admin/api/dreamface-config'

interface Props {
  bananaConfigs: any[]
  railwayConfigs: any[]
  minimaxConfigs: any[]
  dreamfaceConfigs: any[]
}

export function ApiManagementClient({
  bananaConfigs,
  railwayConfigs,
  minimaxConfigs,
  dreamfaceConfigs,
}: Props) {
  return (
    <div className="space-y-6">
      <div suppressHydrationWarning>
        <h1 className="text-3xl font-bold">API 管理中心</h1>
        <p className="text-muted-foreground">统一管理所有 AI 接口配置</p>
      </div>

      <Tabs defaultValue="banana" className="space-y-6">
        <TabsList>
          <TabsTrigger value="banana">Banana 图生图</TabsTrigger>
          <TabsTrigger value="railway">Railway Grok、VEO、Seedance、Sora</TabsTrigger>
          <TabsTrigger value="minimax">MiniMax 声音</TabsTrigger>
          <TabsTrigger value="dreamface">DreamFace 唇同步</TabsTrigger>
        </TabsList>

        <TabsContent value="banana">
          <BananaConfig configs={bananaConfigs} />
        </TabsContent>

        <TabsContent value="railway">
          <RailwayConfig configs={railwayConfigs} />
        </TabsContent>

        <TabsContent value="minimax">
          <MinimaxConfig configs={minimaxConfigs} />
        </TabsContent>

        <TabsContent value="dreamface">
          <DreamFaceConfig configs={dreamfaceConfigs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
