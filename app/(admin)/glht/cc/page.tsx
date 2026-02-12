import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StorageConfig } from '@/components/admin/storage/storage-config'
import { StorageStats } from '@/components/admin/storage/storage-stats'

export default async function StoragePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/wd')

  const { data: config } = await supabase
    .from('storage_config')
    .select('*')
    .eq('is_active', true)
    .single()

  // 统计数据
  const [digitalHumansRes, videosRes, voicesRes] = await Promise.all([
    supabase.from('digital_humans').select('*', { count: 'exact' }),
    supabase.from('videos').select('*', { count: 'exact' }),
    supabase.from('voices').select('*', { count: 'exact' }),
  ])

  const totalFiles = (digitalHumansRes.count || 0) * 2 + (videosRes.count || 0) + (voicesRes.count || 0)
  const imageCount = (digitalHumansRes.count || 0) * 2
  const videoCount = videosRes.count || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">存储管理</h1>
        <p className="text-muted-foreground">管理文件存储和配置</p>
      </div>

      <StorageStats
        totalFiles={totalFiles}
        totalSize={0}
        imageCount={imageCount}
        videoCount={videoCount}
      />

      <StorageConfig config={config} />

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-2">存储说明</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 当前仅支持 Vercel Blob 存储</li>
          <li>• 需要在 Vercel 项目设置中配置 BLOB_READ_WRITE_TOKEN</li>
          <li>• 文件统计基于数据库记录，实际容量请在 Vercel 控制台查看</li>
        </ul>
      </div>
    </div>
  )
}
