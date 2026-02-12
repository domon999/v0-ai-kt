'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function BatchGenerateCards({ onGenerated }: { onGenerated: () => void }) {
  const [prefix, setPrefix] = useState('')
  const [points, setPoints] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prefix || !points || !quantity) {
      toast({ title: '请填写完整信息', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix,
          points: parseInt(points),
          quantity: parseInt(quantity),
        }),
      })

      if (!res.ok) throw new Error('生成失败')

      const data = await res.json()
      toast({ title: `成功生成 ${data.count} 张卡密` })
      setPrefix('')
      setPoints('')
      setQuantity('')
      onGenerated()
    } catch (error) {
      toast({ title: '生成失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量生成卡密</CardTitle>
        <CardDescription>生成指定数量的星光卡</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prefix">卡密前缀</Label>
            <Input
              id="prefix"
              placeholder="例如: VIP"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">积分点数</Label>
            <Input
              id="points"
              type="number"
              placeholder="例如: 1000"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">生成数量</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="例如: 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? '生成中...' : '生成卡密'}
        </Button>
      </CardContent>
    </Card>
  )
}
