'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function VoicesTable({ records }: { records: any[] }) {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">用户邮箱</th>
              <th className="px-4 py-3 text-left text-sm font-medium">声音名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">使用次数</th>
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
                  <td className="px-4 py-3 text-sm">{record.voice_name}</td>
                  <td className="px-4 py-3 text-sm">{record.usage_count || 0}</td>
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
