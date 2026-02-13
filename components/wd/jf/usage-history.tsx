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
      {records.map((record) => {
        const isRecharge = record.type === '充值' || record.amount > 0
        const amount = Math.abs(Number(record.amount))
        
        return (
          <Card key={record.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isRecharge ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <span className={`text-lg font-bold ${
                      isRecharge ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isRecharge ? '+' : '-'}
                    </span>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      isRecharge ? 'text-green-600' : 'text-foreground'
                    }`}>
                      {isRecharge ? '+' : '-'}{amount} 积分
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.description || record.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(record.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                  {record.balance_after !== null && (
                    <p className="text-xs text-muted-foreground">
                      余额：{Number(record.balance_after)} 积分
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
