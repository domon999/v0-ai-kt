'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Background {
  id: string
  name: string
  image_url: string
  is_active: boolean
}

interface BackgroundGridProps {
  backgrounds: Background[]
  onDelete?: (id: string) => void
  isAdmin?: boolean
}

export function BackgroundGrid({ backgrounds, onDelete, isAdmin = false }: BackgroundGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!onDelete) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {backgrounds.map((bg) => (
        <Card key={bg.id} className="overflow-hidden group relative">
          <div className="aspect-video relative">
            <Image
              src={bg.image_url}
              alt={bg.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate">{bg.name}</p>
          </div>
          {isAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(bg.id)}
                disabled={deletingId === bg.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
