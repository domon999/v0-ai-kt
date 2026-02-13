'use client'

import { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { LucideIcon } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyState?: {
    icon?: LucideIcon
    title: string
    description?: string
  }
  keyExtractor: (row: T) => string | number
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState />
  }

  if (!data || data.length === 0) {
    if (emptyState) {
      return <EmptyState {...emptyState} />
    }
    return <EmptyState title="暂无数据" />
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render ? column.render(row) : String((row as any)[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
