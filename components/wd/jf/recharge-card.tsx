'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react'

interface CardInfo {
  cardCode: string
  points: number
  status: string
  isAvailable: boolean
}

export function RechargeCard() {
  const [cardCode, setCardCode] = useState('')
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [isRecharging, setIsRecharging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleQuery = async () => {
    if (!cardCode.trim()) {
      setError('请输入星光卡卡密')
      return
    }

    setError(null)
    setSuccess(null)
    setIsQuerying(true)

    try {
      const res = await fetch(`/api/starlight/query?code=${encodeURIComponent(cardCode.trim())}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || '查询失败')
      }

      setCardInfo(data.card)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setCardInfo(null)
    } finally {
      setIsQuerying(false)
    }
  }

  const handleRecharge = async () => {
    if (!cardInfo || !cardInfo.isAvailable) {
      setError('该卡密无法使用')
      return
    }

    setError(null)
    setSuccess(null)
    setIsRecharging(true)

    try {
      const res = await fetch('/api/starlight/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardCode: cardCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || '充值失败')
      }

      setSuccess(`充值成功！获得 ${data.points} 积分，当前余额：${data.newBalance}`)
      setCardCode('')
      setCardInfo(null)
      
      // 刷新页面以更新余额
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '充值失败')
    } finally {
      setIsRecharging(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          星光卡充值
        </CardTitle>
        <CardDescription>输入星光卡卡密进行充值</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="请输入星光卡卡密"
            value={cardCode}
            onChange={(e) => setCardCode(e.target.value)}
            disabled={isQuerying || isRecharging}
          />
          <Button onClick={handleQuery} disabled={isQuerying || isRecharging}>
            {isQuerying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            查询
          </Button>
        </div>

        {cardInfo && (
          <Alert className={cardInfo.isAvailable ? 'border-green-500' : 'border-red-500'}>
            <div className="flex items-start gap-2">
              {cardInfo.isAvailable ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {cardInfo.isAvailable ? '卡密有效' : '卡密不可用'}
                </p>
                <p className="text-sm text-muted-foreground">
                  卡密：{cardInfo.cardCode} | 点数：{cardInfo.points} | 状态：
                  {cardInfo.status === 'available' ? '可用' : cardInfo.status === 'used' ? '已使用' : '已失效'}
                </p>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {cardInfo?.isAvailable && (
          <Button
            className="w-full"
            onClick={handleRecharge}
            disabled={isRecharging}
          >
            {isRecharging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认充值 {cardInfo.points} 积分
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
