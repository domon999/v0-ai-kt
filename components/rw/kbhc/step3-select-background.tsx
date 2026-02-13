'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, Check } from 'lucide-react'

interface Background {
  id: string
  name: string
  image_url: string
}

interface Step3Props {
  backgrounds: Background[]
  selectedBackgroundId: string | null
  onSelectBackground: (id: string) => void
}

export function Step3SelectBackground({
  backgrounds,
  selectedBackgroundId,
  onSelectBackground,
}: Step3Props) {
  if (backgrounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>选择背景图片</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">暂无可用的背景图片</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择背景图片</CardTitle>
        <p className="text-sm text-muted-foreground">为您的口播视频选择一个背景图片</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {backgrounds.map((bg) => (
            <div
              key={bg.id}
              className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                selectedBackgroundId === bg.id
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectBackground(bg.id)}
            >
              {selectedBackgroundId === bg.id && (
                <div className="absolute right-2 top-2 z-10">
                  <Badge className="gap-1">
                    <Check className="h-3 w-3" />
                    已选择
                  </Badge>
                </div>
              )}
              <img
                src={bg.image_url}
                alt={bg.name}
                className="aspect-video w-full object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-medium">{bg.name}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
