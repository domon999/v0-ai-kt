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
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function BananaConfig({ configs }: { configs: any[] }) {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    config_name: '',
    base_url: '',
    api_key: '',
    priority: 1,
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/banana-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({ description: 'Banana 配置添加成功' })
        setShowDialog(false)
        setFormData({ config_name: '', base_url: '', api_key: '', priority: 1 })
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
        <h2 className="text-2xl font-bold">Banana API 配置</h2>
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
                <div className="flex items-center gap-2">
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? '激活' : '未激活'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm text-muted-foreground">Base URL</label>
                <p className="text-sm">{config.base_url}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">总请求: </span>
                  {config.total_requests}
                </div>
                <div>
                  <span className="text-muted-foreground">成功: </span>
                  {config.success_count}
                </div>
                <div>
                  <span className="text-muted-foreground">失败: </span>
                  {config.error_count}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 Banana 配置</DialogTitle>
            <DialogDescription>填写 Banana API 的配置信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config_name">配置名称</Label>
              <Input
                id="config_name"
                placeholder="例如: Banana API 1"
                value={formData.config_name}
                onChange={(e) =>
                  setFormData({ ...formData, config_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                placeholder="https://api.banana.dev"
                value={formData.base_url}
                onChange={(e) =>
                  setFormData({ ...formData, base_url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="sk_xxx"
                value={formData.api_key}
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) })
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
