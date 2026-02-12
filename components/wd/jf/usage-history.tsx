import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface UsageRecord {
  id: string
  type: string
  amount: number
  balance_after: number | null
  description: string | null
  created_at: string
}

interface UsageHistoryProps {
  records: UsageRecord[]
}

export function UsageHistory({ records }: UsageHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无消费记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {record.type === '充值' ? '+' : '-'}
                  {Number(record.amount).toFixed(2)} 积分
                </p>
                <p className="text-sm text-muted-foreground">
                  {record.description || record.type}
                  {record.balance_after !== null && ` · 余额：${Number(record.balance_after).toFixed(2)}`}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(record.created_at), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
