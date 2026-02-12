import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BalanceHeader } from '@/components/wd/jf/balance-header'
import { PricingTable } from '@/components/wd/jf/pricing-table'
import { RechargeCard } from '@/components/wd/jf/recharge-card'
import { RechargeHistory } from '@/components/wd/jf/recharge-history'
import { UsageHistory } from '@/components/wd/jf/usage-history'

export default async function CreditsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/wd/jf')
  }

  // 并行获取数据
  const [creditsResult, rechargeResult, usageResult] = await Promise.all([
    supabase
      .from('user_credits')
      .select('credits, total_credits')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('recharge_records')
      .select('id, credits, card_code, payment_method, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('credit_usage_records')
      .select('id, type, amount, balance_after, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const credits = creditsResult.data
  const rechargeRecords = rechargeResult.data || []
  const usageRecords = usageResult.data || []

  return (
    <div className="pb-20 space-y-6">
      {/* 顶部余额 */}
      <BalanceHeader
        credits={credits?.credits ? Number(credits.credits) : 0}
        totalCredits={credits?.total_credits ? Number(credits.total_credits) : 0}
      />

      {/* 套餐展示 */}
      <PricingTable />

      {/* 星光卡充值 */}
      <RechargeCard />

      {/* 充值/消费记录 */}
      <Tabs defaultValue="recharge" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recharge">充值记录</TabsTrigger>
          <TabsTrigger value="usage">消费记录</TabsTrigger>
        </TabsList>
        <TabsContent value="recharge" className="mt-4">
          <RechargeHistory records={rechargeRecords} />
        </TabsContent>
        <TabsContent value="usage" className="mt-4">
          <UsageHistory records={usageRecords} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
