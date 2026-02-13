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
import { Plus, Edit, Trash2, Power } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function RailwayConfig({ configs }: { configs: any[] }) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState<any>(null)
  const [formData, setFormData] = useState({
    config_name: '',
    api_base_url: '',
    api_key: '',
    priority: 1,
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (config: any) => {
    setEditingConfig(config)
    setFormData({
      config_name: config.config_name,
      api_base_url: config.api_base_url,
      api_key: config.api_key,
      priority: config.priority,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return

    try {
      const response = await fetch(`/api/admin/railway-config?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ description: '配置删除成功' })
        router.refresh()
      } else {
        toast({ description: '删除失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ description: '删除失败', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (config: any) => {
    try {
      const response = await fetch('/api/admin/railway-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: config.id,
          is_active: !config.is_active,
        }),
      })

      if (response.ok) {
        toast({ description: '状态更新成功' })
        router.refresh()
      } else {
        toast({ description: '更新失败', variant: 'destructive' })
      }
    } catch (error) {
      toast({ description: '更新失败', variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const isEditing = !!editingConfig
      const response = await fetch('/api/admin/railway-config', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing ? { id: editingConfig.id, ...formData } : formData
        ),
      })

      if (response.ok) {
        toast({
          description: isEditing ? '配置更新成功' : 'Railway 配置添加成功',
        })
        setShowDialog(false)
        setEditingConfig(null)
        setFormData({
          config_name: '',
          api_base_url: '',
          api_key: '',
          priority: 1,
        })
        router.refresh()
      } else {
        toast({
          description: isEditing ? '更新失败' : '添加失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        description: editingConfig ? '更新失败' : '添加失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Railway Grok、VEO、Seedance、Sora</h2>
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
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{config.config_name}</CardTitle>
                  <Badge variant="outline">优先级 {config.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? '激活' : '未激活'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(config)}
                    title={config.is_active ? '停用' : '启用'}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{config.api_base_url}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">成功: {config.success_count || 0}</span>
                  <span className="text-red-600">失败: {config.fail_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? '编辑 Railway 配置' : '添加 Railway 配置'}
            </DialogTitle>
            <DialogDescription>填写 Railway Grok、VEO、Seedance、Sora 的配置信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config_name">配置名称</Label>
              <Input
                id="config_name"
                placeholder="例如: Railway Grok 1"
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
                placeholder="输入 API Key（留空保持不变）"
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
              <p className="text-xs text-muted-foreground">
                数字越小优先级越高（1 = 主力，2 = 备用）
              </p>
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
              {loading
                ? editingConfig
                  ? '更新中...'
                  : '添加中...'
                : editingConfig
                  ? '确认更新'
                  : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
