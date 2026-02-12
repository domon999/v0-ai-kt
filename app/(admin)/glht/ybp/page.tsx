import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, Video, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 获取统计数据
  const [usersResult, creditsResult, videosResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_credits').select('credits').gt('credits', 0),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
  ])

  const totalUsers = usersResult.count || 0
  const totalCredits = creditsResult.data?.reduce((sum, item) => sum + Number(item.credits), 0) || 0
  const totalVideos = videosResult.count || 0

  const stats = [
    {
      title: '总用户数',
      value: totalUsers,
      icon: Users,
      description: '注册用户总数',
    },
    {
      title: '积分总量',
      value: totalCredits.toLocaleString(),
      icon: CreditCard,
      description: '系统积分余额',
    },
    {
      title: '生成视频',
      value: totalVideos,
      icon: Video,
      description: '累计生成视频数',
    },
    {
      title: '今日活跃',
      value: '0',
      icon: TrendingUp,
      description: '今日活跃用户',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">查看平台运营数据概览</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            欢迎使用客小兔管理后台。从左侧菜单选择功能开始管理。
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">用户管理</h3>
                <p className="text-sm text-muted-foreground">查看和管理所有注册用户</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">API 配置</h3>
                <p className="text-sm text-muted-foreground">配置 AI 服务接口</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
