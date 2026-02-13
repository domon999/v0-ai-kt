import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending'

interface StatusBadgeProps {
  status: StatusType
  label: string
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  error: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
  pending: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20',
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(statusStyles[status], className)}>
      {label}
    </Badge>
  )
}
