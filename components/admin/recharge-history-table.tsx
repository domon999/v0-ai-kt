'use client'

import { format } from 'date-fns'

type RechargeRecord = {
  id: string
  user_email: string
  card_code: string
  points_added: number
  created_at: string
}

export function RechargeHistoryTable({ records }: { records: RechargeRecord[] }) {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">用户邮箱</th>
              <th className="px-4 py-3 text-left text-sm font-medium">卡密</th>
              <th className="px-4 py-3 text-left text-sm font-medium">充值积分</th>
              <th className="px-4 py-3 text-left text-sm font-medium">充值时间</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b">
                <td className="px-4 py-3 text-sm">{record.user_email}</td>
                <td className="px-4 py-3 font-mono text-sm">{record.card_code}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">+{record.points_added}</td>
                <td className="px-4 py-3 text-sm">{format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
