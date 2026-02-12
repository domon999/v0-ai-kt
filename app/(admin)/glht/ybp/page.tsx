import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import { Users, CreditCard, Video, Mic, FileVideo, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [usersResult, todayUsersResult, creditsResult, videosResult, voicesResult, worksResult] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      supabase.from('user_credits').select('credits'),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('voices').select('id', { count: 'exact', head: true }),
      supabase.from('works').select('id', { count: 'exact', head: true }),
    ])

  const totalUsers = usersResult.count || 0
  const todayUsers = todayUsersResult.count || 0
  const totalCredits =
    creditsResult.data?.reduce((sum, item) => sum + Number(item.credits || 0), 0) || 0
  const totalVideos = videosResult.count || 0
  const totalVoices = voicesResult.count || 0
  const totalWorks = worksResult.count || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">查看平台运营数据概览</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="总用户数"
          value={totalUsers}
          description={`今日新增 ${todayUsers} 人`}
          icon={Users}
        />
        <StatCard
          title="积分总量"
          value={totalCredits.toLocaleString()}
          description="系统积分余额"
          icon={CreditCard}
        />
        <StatCard
          title="生成视频"
          value={totalVideos}
          description="累计生成数字人视频"
          icon={Video}
        />
        <StatCard
          title="克隆声音"
          value={totalVoices}
          description="累计克隆声音模型"
          icon={Mic}
        />
        <StatCard
          title="完成作品"
          value={totalWorks}
          description="用户完成的口播作品"
          icon={FileVideo}
        />
        <StatCard
          title="今日活跃"
          value={todayUsers}
          description="今日活跃用户数"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/glht/yhlb"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">用户管理</h3>
                <p className="text-sm text-muted-foreground">查看和管理所有注册用户</p>
              </div>
            </Link>
            <Link
              href="/glht/jfk"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
            >
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">积分卡管理</h3>
                <p className="text-sm text-muted-foreground">批量生成和管理星光卡</p>
              </div>
            </Link>
            <Link
              href="/glht/api"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent"
            >
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">API 配置</h3>
                <p className="text-sm text-muted-foreground">配置 AI 服务接口</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">数据库</span>
              <span className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                正常
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">存储服务</span>
              <span className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                正常
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI 服务</span>
              <span className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                部分配置
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
