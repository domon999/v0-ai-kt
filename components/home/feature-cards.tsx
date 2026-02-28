import { Card, CardContent } from '@/components/ui/card'
import { Video, Mic, Zap, ImageIcon, Wand2, Clock } from 'lucide-react'

const features = [
  {
    icon: Video,
    title: '数字人克隆',
    description: '上传一张照片，即可生成逼真的数字人形象，支持多种动作和表情。',
  },
  {
    icon: Mic,
    title: '声音克隆',
    description: '高保真声音克隆技术，让数字人说话声音更自然，更接近真人。',
  },
  {
    icon: Zap,
    title: '快速生成',
    description: 'AI 驱动的高速渲染引擎，几分钟内即可生成高质量口播视频。',
  },
  {
    icon: ImageIcon,
    title: '自定义背景',
    description: '丰富的背景库，支持自定义上传，让视频更符合品牌调性。',
  },
  {
    icon: Wand2,
    title: '智能对口型',
    description: '先进的唇同步技术，确保数字人说话时口型与声音完美匹配。',
  },
  {
    icon: Clock,
    title: '视频延长',
    description: '灵活的视频时长控制，支持延长视频以满足不同场景需求。',
  },
]

export function FeatureCards() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">核心功能</h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            强大的 AI 技术支持，为您提供专业级的数字人口播视频制作能力
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-border/50 transition-colors hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
