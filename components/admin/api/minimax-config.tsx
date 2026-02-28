'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Edit, Trash2, Power, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function MinimaxConfig({ configs: initialConfigs }: { configs: any[] }) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState<any>(null)
  const [formData, setFormData] = useState({
    config_name: '',
    group_id: '',
    api_key: '',
    priority: 1,
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setConfigs(initialConfigs)
  }, [initialConfigs])

  const handleEdit = (config: any) => {
    setEditingConfig(config)
    setFormData({
      config_name: config.provider,
      group_id: config.group_id || '',
      api_key: '',
      priority: config.priority,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return

    try {
      const response = await fetch(`/api/admin/minimax-config?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ description: '配置删除成功' })
        setConfigs(configs.filter(c => c.id !== id))
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
      const response = await fetch('/api/admin/minimax-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: config.id,
          enabled: !config.enabled,
        }),
      })

      if (response.ok) {
        toast({ description: '状态更新成功' })
        setConfigs(configs.map(c => 
          c.id === config.id ? { ...c, enabled: !c.enabled } : c
        ))
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
      const submitData = isEditing ? { id: editingConfig.id, ...formData } : formData
      
      console.log('[v0] Submitting MiniMax config:', submitData)
      
      const response = await fetch('/api/admin/minimax-config', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      console.log('[v0] Response status:', response.status)
      const responseData = await response.json()
      console.log('[v0] Response data:', responseData)

      if (response.ok) {
        toast({
          description: isEditing ? '配置更新成功' : 'MiniMax 配置添加成功',
        })
        
        // 更新本地状态
        if (isEditing) {
          setConfigs(configs.map(c => 
            c.id === editingConfig.id ? responseData.data : c
          ))
        } else {
          setConfigs([...configs, responseData.data])
        }
        
        setShowDialog(false)
        setEditingConfig(null)
        setFormData({
          config_name: '',
          group_id: '',
          api_key: '',
          priority: 1,
        })
        router.refresh()
      } else {
        console.error('[v0] Request failed:', responseData)
        toast({
          description: isEditing ? '更新失败' : '添加失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[v0] Submit error:', error)
      toast({
        description: editingConfig ? '更新失败' : '添加失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const hasInvalidConfigs = configs.some(c => !c.api_key)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">MiniMax 声音配置</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加配置
        </Button>
      </div>

      {/* 管理员提示 */}
      {hasInvalidConfigs && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">配置提醒</h3>
              <p className="text-sm text-orange-800 mt-1">
                有配置项缺少 API Key，请检查并补全。API Key 未正确保存可能导致语音合成功能无法使用。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{config.provider}</CardTitle>
                  <Badge variant="outline">优先级 {config.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? '激活' : '未激活'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(config)}
                    title={config.enabled ? '停用' : '启用'}
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
              <div className="space-y-3">
                {/* API Key 状态 */}
                <div className="flex items-center gap-2">
                  {config.api_key ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        API Key 已保存
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({config.api_key.slice(0, 8)}...{config.api_key.slice(-4)})
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600 font-medium">
                        未配置 API Key
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Group ID: {config.group_id || '未配置'}
                </p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">
                    成功: {config.success_requests || 0}
                  </span>
                  <span className="text-red-600">
                    失败: {config.failed_requests || 0}
                  </span>
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
              {editingConfig ? '编辑 MiniMax 配置' : '添加 MiniMax 配置'}
            </DialogTitle>
            <DialogDescription>填写 MiniMax 声音服务的配置信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config_name">配置名称</Label>
              <Input
                id="config_name"
                placeholder="例如: MiniMax Voice 1"
                value={formData.config_name}
                onChange={(e) =>
                  setFormData({ ...formData, config_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_id">Group ID</Label>
              <Input
                id="group_id"
                placeholder="输入 MiniMax Group ID（可选）"
                value={formData.group_id}
                onChange={(e) =>
                  setFormData({ ...formData, group_id: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder={editingConfig ? '留空保持不变' : '输入 API Key'}
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
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value),
                  })
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
