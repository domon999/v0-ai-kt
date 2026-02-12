'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Image as ImageIcon } from 'lucide-react'

interface Background {
  id: string
  name: string
  image_url: string
}

interface Step3Props {
  onSelect: (background: Background) => void
  selectedBackground: Background | null
}

export function Step3SelectBackground({ onSelect, selectedBackground }: Step3Props) {
  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBackgrounds()
  }, [])

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch('/api/backgrounds')
      const data = await res.json()
      setBackgrounds(data)
    } catch (error) {
      console.error('[v0] Failed to fetch backgrounds:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">选择背景图片</h3>
        <p className="text-sm text-muted-foreground">为视频选择一个合适的背景</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : backgrounds.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">暂无背景图片</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {backgrounds.map((bg) => (
            <Card
              key={bg.id}
              className={`cursor-pointer overflow-hidden transition-all ${
                selectedBackground?.id === bg.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(bg)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <img
                    src={bg.image_url}
                    alt={bg.name}
                    className="h-full w-full object-cover"
                  />
                  {selectedBackground?.id === bg.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{bg.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
