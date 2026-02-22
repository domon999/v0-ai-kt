'use client'

import { useState, useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/performance-monitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 每隔500ms更新一次日志
    const interval = setInterval(() => {
      const currentLogs = PerformanceMonitor.getLogs()
      setLogs(currentLogs)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
        size="sm"
      >
        显示性能监控
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden shadow-lg">
      <CardHeader className="p-3 bg-muted">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">性能监控面板</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {logs.length} 条日志
            </Badge>
            <Button
              onClick={() => {
                PerformanceMonitor.clear()
                setLogs([])
              }}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              清空
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto bg-black text-green-400 font-mono text-xs p-3">
          {logs.length === 0 ? (
            <p className="text-gray-500">等待操作...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  log.includes('🐌') || log.includes('⚠️')
                    ? 'text-yellow-400'
                    : log.includes('START')
                    ? 'text-blue-400'
                    : log.includes('END')
                    ? 'text-green-400'
                    : ''
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
