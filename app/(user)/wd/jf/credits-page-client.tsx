'use client'

import { useState } from 'react'
import { BalanceCard } from '@/components/wd/jf/balance-card'
import { RechargeForm } from '@/components/wd/jf/recharge-form'
import { RechargeHistory } from '@/components/wd/jf/recharge-history'

interface RechargeRecord {
  id: string
  credits: number
  card_code: string
  created_at: string
}

interface CreditsPageClientProps {
  initialBalance: number
  initialRecords: RechargeRecord[]
}

export function CreditsPageClient({ initialBalance, initialRecords }: CreditsPageClientProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [records, setRecords] = useState(initialRecords)

  const handleRechargeSuccess = async () => {
    // 重新获取积分余额
    const response = await fetch('/api/user/credits')
    if (response.ok) {
      const data = await response.json()
      setBalance(data.credits)
    }

    // 重新获取充值记录
    const recordsResponse = await fetch('/api/recharge-records')
    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json()
      setRecords(recordsData.records)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">积分管理</h1>
        <p className="mt-2 text-muted-foreground">查看积分余额，使用星光卡充值</p>
      </div>

      <BalanceCard balance={balance} />

      <div className="grid gap-6 md:grid-cols-2">
        <RechargeForm onSuccess={handleRechargeSuccess} />
        <RechargeHistory records={records} />
      </div>
    </div>
  )
}
