'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Sparkles } from 'lucide-react'

export function PricingTable() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">功能价格说明</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  <strong>数字人生成：</strong>200 积分/次
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  <strong>视频延长：</strong>200 积分/次
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  <strong>克隆声音：</strong>1200 积分/次
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  <strong>TTS 合成：</strong>约 10 积分/100字
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  <strong>唇同步：</strong>50 积分/次
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>充值说明：</strong>目前仅支持使用星光卡充值积分。请联系管理员获取星光卡，然后在下方输入卡密进行充值。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
