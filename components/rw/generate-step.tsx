'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface GenerateStepProps {
  imageUrl: string
  onGenerateComplete: (digitalHumanUrl: string, digitalHumanId: string) => void
}

export function GenerateStep({ imageUrl, onGenerateComplete }: GenerateStepProps) {
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/banana/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }

      const data = await response.json()
      setGeneratedImage(data.generatedImageUrl)
      onGenerateComplete(data.generatedImageUrl, data.digitalHumanId)
    } catch (error: any) {
      console.error('Generate error:', error)
      alert(error.message || '生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-2 text-lg font-semibold">生成数字人</h3>
            <p className="text-sm text-muted-foreground">
              AI 将您的照片转换为数字人形象
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">原始照片</p>
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt="Original"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">数字人形象</p>
              {generatedImage ? (
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                  <p className="text-sm text-muted-foreground">等待生成</p>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !!generatedImage}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : generatedImage ? (
              '已生成'
            ) : (
              '开始生成 (200 积分)'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
