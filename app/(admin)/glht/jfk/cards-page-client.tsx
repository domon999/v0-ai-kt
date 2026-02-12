'use client'

import { useState } from 'react'
import { BatchGenerateCards } from '@/components/admin/batch-generate-cards'
import { CardsTable } from '@/components/admin/cards-table'
import { RechargeHistoryTable } from '@/components/admin/recharge-history-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function CardsPageClient({ initialCards, initialRecords }: { initialCards: any[]; initialRecords: any[] }) {
  const [cards, setCards] = useState(initialCards)

  const refreshCards = async () => {
    const res = await fetch('/api/admin/cards')
    if (res.ok) {
      const data = await res.json()
      setCards(data.cards)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">积分卡管理</h1>
        <p className="text-muted-foreground">批量生成星光卡、查看卡密状态和充值记录</p>
      </div>

      <BatchGenerateCards onGenerated={refreshCards} />

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">卡密列表</TabsTrigger>
          <TabsTrigger value="recharge">充值记录</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          <CardsTable cards={cards} />
        </TabsContent>
        <TabsContent value="recharge" className="mt-4">
          <RechargeHistoryTable
            records={initialRecords.map((r: any) => ({
              ...r,
              user_email: r.profiles?.email || '未知',
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
