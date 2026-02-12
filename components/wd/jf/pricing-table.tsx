import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

const pricingTiers = [
  { name: '周卡', price: '15', credits: '2000', popular: false },
  { name: '月卡', price: '59', credits: '10000', popular: true },
  { name: '年卡', price: '499', credits: '100000', popular: false },
  { name: '三年卡', price: '1299', credits: '300000', popular: false },
  { name: '加餐', price: '9', credits: '1000', popular: false },
]

export function PricingTable() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">功能价格说明</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            口播模板：200 积分/次
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            视频延长：200 积分/次
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            克隆声音：1200 积分/次
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            TTS 合成：约 10 积分/100字
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            对口型：50 积分/次
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">套餐选择</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={tier.popular ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  {tier.popular && <Badge>推荐</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">¥{tier.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  获得 {tier.credits} 积分
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  暂时只支持星光卡充值
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
