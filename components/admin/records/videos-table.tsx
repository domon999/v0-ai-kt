'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export function VideosTable({ records }: { records: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'processing': return '处理中'
      case 'failed': return '失败'
      default: return status
    }
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">用户邮箱</th>
              <th className="px-4 py-3 text-left text-sm font-medium">时长</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">消耗积分</th>
              <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无记录
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{record.user_email}</td>
                  <td className="px-4 py-3 text-sm">{record.duration || 16}秒</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getStatusColor(record.status)}>
                      {getStatusText(record.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{record.credits_used}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: zhCN })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
