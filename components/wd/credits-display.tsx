'use client'

import Link from 'next/link'
import { Coins, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CreditsDisplayProps {
  credits: number
  totalCredits: number
}

export function CreditsDisplay({ credits, totalCredits }: CreditsDisplayProps) {
  return (
    <Card className="mx-4 mt-4 overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前积分</p>
              <p className="text-2xl font-bold text-foreground">
                {credits.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/wd/jf">
              充值
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            累计充值：{totalCredits.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} 积分
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
