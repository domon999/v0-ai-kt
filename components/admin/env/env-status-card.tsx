'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface EnvVariable {
  name: string
  value?: string
  required: boolean
  masked?: boolean
}

interface EnvStatusCardProps {
  title: string
  description: string
  variables: EnvVariable[]
}

export function EnvStatusCard({ title, description, variables }: EnvStatusCardProps) {
  const allConfigured = variables.filter(v => v.required).every(v => v.value)
  const configuredCount = variables.filter(v => v.value).length
  const totalCount = variables.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {allConfigured ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              已配置
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              未完成
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {variables.map((variable) => (
            <div key={variable.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {variable.value ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : variable.required ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm font-mono">{variable.name}</span>
              </div>
              {variable.value && (
                <span className="text-xs text-muted-foreground font-mono">
                  {variable.masked ? '••••••••' : variable.value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            已配置: {configuredCount}/{totalCount}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
