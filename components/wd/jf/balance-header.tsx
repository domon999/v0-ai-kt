'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCredits } from '@/hooks/use-credits'

interface BalanceHeaderProps {
  credits: number
  totalCredits: number
}

export function BalanceHeader({ credits, totalCredits }: BalanceHeaderProps) {
  const { credits: liveCredits, isLoading, refresh } = useCredits()
  const displayCredits = liveCredits ?? credits

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">当前积分余额</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                disabled={isLoading}
                className="h-6 w-6"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-4xl font-bold">{displayCredits.toFixed(2)}</p>
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
