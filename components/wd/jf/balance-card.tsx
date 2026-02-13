'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Coins } from 'lucide-react'

interface BalanceCardProps {
  balance: number
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">当前积分余额</p>
            <p className="text-4xl font-bold mt-2">{balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">星光积分</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Coins className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
