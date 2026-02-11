import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/home/hero-section'
import { FeatureCards } from '@/components/home/feature-cards'
import { PricingPreview } from '@/components/home/pricing-preview'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen pb-20">
      <HeroSection isLoggedIn={!!user} />
      <FeatureCards />
      <PricingPreview isLoggedIn={!!user} />

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">&copy; 2024 客小兔 AI 口播数字人平台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
