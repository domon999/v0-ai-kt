'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { useState } from 'react'

interface UploadBackgroundProps {
  onUploadSuccess: () => void
}

export function UploadBackground({ onUploadSuccess }: UploadBackgroundProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name || file.name)

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('上传失败')

      const { url } = await uploadRes.json()

      const bgRes = await fetch('/api/backgrounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || file.name, image_url: url }),
      })

      if (!bgRes.ok) throw new Error('创建背景失败')

      setFile(null)
      setName('')
      onUploadSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">背景名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入背景名称"
        />
      </div>
      <div>
        <Label htmlFor="file">选择图片</Label>
        <Input
          id="file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      <Button type="submit" disabled={!file || loading}>
        <Upload className="h-4 w-4 mr-2" />
        {loading ? '上传中...' : '上传背景'}
      </Button>
    </form>
  )
}
