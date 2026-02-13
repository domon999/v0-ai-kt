'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Gift } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RechargeFormProps {
  onSuccess: () => void
}

export function RechargeForm({ onSuccess }: RechargeFormProps) {
  const [cardCode, setCardCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardCode.trim()) {
      toast({
        title: '请输入卡密',
        description: '请输入有效的星光卡卡密',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardCode: cardCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '充值失败')
      }

      toast({
        title: '充值成功',
        description: `已充值 ${data.credits} 积分`,
      })

      setCardCode('')
      onSuccess()
    } catch (error: any) {
      toast({
        title: '充值失败',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle>充值积分</CardTitle>
        </div>
        <CardDescription>输入星光卡卡密进行充值</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRecharge} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardCode">卡密</Label>
            <Input
              id="cardCode"
              placeholder="请输入星光卡卡密"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '充值中...' : '立即充值'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
