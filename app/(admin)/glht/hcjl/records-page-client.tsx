'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DigitalHumansTable } from '@/components/admin/records/digital-humans-table'
import { VideosTable } from '@/components/admin/records/videos-table'
import { VoicesTable } from '@/components/admin/records/voices-table'

interface RecordsPageClientProps {
  digitalHumans: any[]
  videos: any[]
  voices: any[]
}

export function RecordsPageClient({ digitalHumans, videos, voices }: RecordsPageClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">合成记录</h1>
        <p className="mt-2 text-muted-foreground">查看所有用户的 AI 生成记录</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">数字人总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{digitalHumans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">视频总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">声音模型总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Records Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>生成记录</CardTitle>
          <CardDescription>最近 100 条生成记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="digital-humans" className="space-y-4">
            <TabsList>
              <TabsTrigger value="digital-humans">数字人</TabsTrigger>
              <TabsTrigger value="videos">视频</TabsTrigger>
              <TabsTrigger value="voices">声音</TabsTrigger>
            </TabsList>
            <TabsContent value="digital-humans" className="space-y-4">
              <DigitalHumansTable records={digitalHumans} />
            </TabsContent>
            <TabsContent value="videos" className="space-y-4">
              <VideosTable records={videos} />
            </TabsContent>
            <TabsContent value="voices" className="space-y-4">
              <VoicesTable records={voices} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
