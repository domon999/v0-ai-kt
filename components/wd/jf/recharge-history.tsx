import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RechargeRecord {
  id: string
  credits: number
  card_code: string | null
  payment_method: string | null
  created_at: string
}

interface RechargeHistoryProps {
  records: RechargeRecord[]
}

export function RechargeHistory({ records }: RechargeHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无充值记录
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
                <p className="font-medium">+{Number(record.credits).toFixed(2)} 积分</p>
                <p className="text-sm text-muted-foreground">
                  {record.payment_method === 'starlight_card' ? '星光卡充值' : '其他方式'}
                  {record.card_code && ` · ${record.card_code.slice(0, 4)}****`}
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
