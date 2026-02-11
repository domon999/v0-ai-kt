import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'

const pricingPlans = [
  {
    name: '周卡',
    price: '15',
    period: '周',
    credits: '1000',
    features: ['数字人克隆', '声音克隆', '视频生成', '基础支持'],
  },
  {
    name: '月卡',
    price: '59',
    period: '月',
    credits: '5000',
    features: ['数字人克隆', '声音克隆', '视频生成', '优先支持', '无限延长'],
    popular: true,
  },
  {
    name: '年卡',
    price: '499',
    period: '年',
    credits: '60000',
    features: ['数字人克隆', '声音克隆', '视频生成', 'VIP 支持', '无限延长', '自定义背景'],
  },
]

export function PricingPreview({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">灵活的套餐选择</h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            选择适合您的套餐，开始创作专业口播视频
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? 'border-primary shadow-lg' : 'border-border/50'}
            >
              <CardHeader>
                {plan.popular && (
                  <div className="mb-2 inline-block self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    最受欢迎
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">¥{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.credits} 星光点</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                  <Link href={isLoggedIn ? '/wd/jf' : '/auth/sign-up'}>
                    {isLoggedIn ? '立即充值' : '开始使用'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
