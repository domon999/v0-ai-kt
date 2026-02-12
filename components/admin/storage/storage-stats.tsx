import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, HardDrive, Image, Video } from 'lucide-react'

interface StorageStatsProps {
  totalFiles: number
  totalSize: number
  imageCount: number
  videoCount: number
}

export function StorageStats({ totalFiles, totalSize, imageCount, videoCount }: StorageStatsProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const stats = [
    { title: '总文件数', value: totalFiles, icon: Database, color: 'text-blue-500' },
    { title: '总容量', value: formatSize(totalSize), icon: HardDrive, color: 'text-green-500' },
    { title: '图片文件', value: imageCount, icon: Image, color: 'text-purple-500' },
    { title: '视频文件', value: videoCount, icon: Video, color: 'text-orange-500' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
