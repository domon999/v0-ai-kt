'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface CreditsState {
  balance: number
  isLoading: boolean
  error: string | null
}

export function useCredits() {
  const { toast } = useToast()
  const [state, setState] = useState<CreditsState>({
    balance: 0,
    isLoading: true,
    error: null,
  })

  const fetchBalance = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()

      if (data.success) {
        setState({
          balance: data.data.credits,
          isLoading: false,
          error: null,
        })
      } else {
        throw new Error(data.error || '获取积分失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取积分失败'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [])

  const checkSufficient = useCallback(
    (required: number): boolean => {
      if (state.balance < required) {
        toast({
          title: '积分不足',
          description: `需要 ${required} 积分，当前余额 ${state.balance} 积分`,
          variant: 'destructive',
        })
        return false
      }
      return true
    },
    [state.balance, toast]
  )

  const refresh = fetchBalance

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    ...state,
    checkSufficient,
    refresh,
  }
}
