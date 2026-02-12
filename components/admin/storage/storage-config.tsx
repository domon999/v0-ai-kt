'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function StorageConfig({ config }: { config: any }) {
  const [token, setToken] = useState(config?.vercel_blob_token || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercel_blob_token: token, provider: 'vercel_blob' }),
      })

      if (!response.ok) throw new Error('Failed to save configuration')
      
      alert('配置已保存')
      window.location.reload()
    } catch (error) {
      alert('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>存储配置</CardTitle>
        <CardDescription>配置 Vercel Blob 存储服务</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="blob-token">Vercel Blob Token</Label>
          <Input
            id="blob-token"
            type="password"
            placeholder="blob_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            在 Vercel 项目设置中生成 BLOB_READ_WRITE_TOKEN
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? '保存中...' : '保存配置'}
        </Button>
      </CardContent>
    </Card>
  )
}
