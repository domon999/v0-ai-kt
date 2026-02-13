'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function RailwayConfig({ configs }: { configs: any[] }) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    config_name: '',
    api_base_url: '',
    api_key: '',
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/railway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({ description: 'Railway 配置添加成功' })
        setShowDialog(false)
        setFormData({ config_name: '', api_base_url: '', api_key: '' })
        router.refresh()
      } else {
        toast({ description: '添加失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ description: '添加失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Railway VEO 3.1 配置</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加配置
        </Button>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{config.config_name}</CardTitle>
                <Badge variant={config.is_active ? 'default' : 'secondary'}>
                  {config.is_active ? '激活' : '未激活'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{config.api_base_url}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 Railway 配置</DialogTitle>
            <DialogDescription>填写 Railway VEO 3.1 的配置信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config_name">配置名称</Label>
              <Input
                id="config_name"
                placeholder="例如: Railway VEO 1"
                value={formData.config_name}
                onChange={(e) =>
                  setFormData({ ...formData, config_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_base_url">API Base URL</Label>
              <Input
                id="api_base_url"
                placeholder="https://xxx.railway.app"
                value={formData.api_base_url}
                onChange={(e) =>
                  setFormData({ ...formData, api_base_url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="输入 API Key"
                value={formData.api_key}
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '添加中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
