'use client'

import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

type Card = {
  card_code: string
  points: number
  status: string
  redeemed_by?: string
  redeemed_at?: string
  created_at: string
}

export function CardsTable({ cards }: { cards: Card[] }) {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">卡密</th>
              <th className="px-4 py-3 text-left text-sm font-medium">积分</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">使用者</th>
              <th className="px-4 py-3 text-left text-sm font-medium">使用时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.card_code} className="border-b">
                <td className="px-4 py-3 font-mono text-sm">{card.card_code}</td>
                <td className="px-4 py-3 text-sm">{card.points}</td>
                <td className="px-4 py-3">
                  <Badge variant={card.status === 'available' ? 'default' : 'secondary'}>
                    {card.status === 'available' ? '可用' : '已使用'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">{card.redeemed_by || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {card.redeemed_at ? format(new Date(card.redeemed_at), 'yyyy-MM-dd HH:mm') : '-'}
                </td>
                <td className="px-4 py-3 text-sm">{format(new Date(card.created_at), 'yyyy-MM-dd HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
