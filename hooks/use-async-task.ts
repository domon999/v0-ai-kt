'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface AsyncTaskState<T = any> {
  isLoading: boolean
  isPolling: boolean
  progress: number
  data: T | null
  error: string | null
}

export interface UseAsyncTaskOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  pollingInterval?: number
  maxPollingAttempts?: number
  showToast?: boolean
}

export function useAsyncTask<T = any>(options: UseAsyncTaskOptions = {}) {
  const { toast } = useToast()
  const {
    onSuccess,
    onError,
    pollingInterval = 2000,
    maxPollingAttempts = 60,
    showToast = true,
  } = options

  const [state, setState] = useState<AsyncTaskState<T>>({
    isLoading: false,
    isPolling: false,
    progress: 0,
    data: null,
    error: null,
  })

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isPolling: false,
      progress: 0,
      data: null,
      error: null,
    })
  }, [])

  const execute = useCallback(
    async (taskFn: () => Promise<T>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await taskFn()
        setState((prev) => ({ ...prev, isLoading: false, data: result }))
        
        if (showToast) {
          toast({ description: '操作成功' })
        }
        
        onSuccess?.(result)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }))
        
        if (showToast) {
          toast({ description: errorMessage, variant: 'destructive' })
        }
        
        onError?.(errorMessage)
        throw error
      }
    },
    [onSuccess, onError, showToast, toast]
  )

  const poll = useCallback(
    async (
      submitFn: () => Promise<{ taskId: string }>,
      queryFn: (taskId: string) => Promise<{ status: string; result?: T; error?: string }>
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // 提交任务
        const { taskId } = await submitFn()
        setState((prev) => ({ ...prev, isLoading: false, isPolling: true, progress: 0 }))

        // 轮询任务状态
        let attempts = 0
        const pollInterval = setInterval(async () => {
          attempts++
          const progress = Math.min((attempts / maxPollingAttempts) * 100, 95)
          setState((prev) => ({ ...prev, progress }))

          try {
            const status = await queryFn(taskId)

            if (status.status === 'completed' && status.result) {
              clearInterval(pollInterval)
              setState((prev) => ({
                ...prev,
                isPolling: false,
                progress: 100,
                data: status.result!,
              }))
              
              if (showToast) {
                toast({ description: '任务完成' })
              }
              
              onSuccess?.(status.result)
            } else if (status.status === 'failed' || status.error) {
              clearInterval(pollInterval)
              const errorMessage = status.error || '任务失败'
              setState((prev) => ({
                ...prev,
                isPolling: false,
                error: errorMessage,
              }))
              
              if (showToast) {
                toast({ description: errorMessage, variant: 'destructive' })
              }
              
              onError?.(errorMessage)
            } else if (attempts >= maxPollingAttempts) {
              clearInterval(pollInterval)
              const timeoutError = '任务超时，请稍后查看结果'
              setState((prev) => ({
                ...prev,
                isPolling: false,
                error: timeoutError,
              }))
              
              if (showToast) {
                toast({ description: timeoutError, variant: 'destructive' })
              }
              
              onError?.(timeoutError)
            }
          } catch (error) {
            console.error('[v0] Polling error:', error)
          }
        }, pollingInterval)

        return () => clearInterval(pollInterval)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '提交任务失败'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPolling: false,
          error: errorMessage,
        }))
        
        if (showToast) {
          toast({ description: errorMessage, variant: 'destructive' })
        }
        
        onError?.(errorMessage)
        throw error
      }
    },
    [onSuccess, onError, pollingInterval, maxPollingAttempts, showToast, toast]
  )

  return {
    ...state,
    execute,
    poll,
    reset,
  }
}
