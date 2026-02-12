import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp } from 'lucide-react'

interface BalanceHeaderProps {
  credits: number
  totalCredits: number
}

export function BalanceHeader({ credits, totalCredits }: BalanceHeaderProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">当前积分余额</p>
            <p className="text-4xl font-bold">{credits.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>累计充值：{totalCredits.toFixed(2)} 积分</span>
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
