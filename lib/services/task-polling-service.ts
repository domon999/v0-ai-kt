/**
 * 通用任务轮询服务
 * 用于轮询 AI 服务的异步任务状态
 */

export interface TaskPollingOptions {
  /** 轮询间隔（毫秒），默认 2000ms */
  interval?: number
  /** 最大轮询次数，默认 60 次（2分钟） */
  maxAttempts?: number
  /** 超时时间（毫秒），默认 120000ms（2分钟） */
  timeout?: number
  /** 轮询前的初始延迟（毫秒），默认 1000ms */
  initialDelay?: number
}

export interface TaskPollingResult<T = any> {
  success: boolean
  data?: T
  error?: string
  attempts?: number
}

export type TaskStatusChecker<T> = () => Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  data?: T
  error?: string
}>

/**
 * 轮询任务状态直到完成或失败
 */
export class TaskPollingService {
  /**
   * 轮询任务状态
   * @param checker 状态检查函数
   * @param options 轮询选项
   * @returns 任务结果
   */
  static async poll<T>(
    checker: TaskStatusChecker<T>,
    options: TaskPollingOptions = {}
  ): Promise<TaskPollingResult<T>> {
    const {
      interval = 2000,
      maxAttempts = 60,
      timeout = 120000,
      initialDelay = 1000,
    } = options

    // 初始延迟
    if (initialDelay > 0) {
      await this.sleep(initialDelay)
    }

    const startTime = Date.now()
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++

      // 检查超时
      if (Date.now() - startTime > timeout) {
        console.error('[v0] Task polling timeout after', attempts, 'attempts')
        return {
          success: false,
          error: '任务处理超时',
          attempts,
        }
      }

      try {
        const result = await checker()

        console.log('[v0] Task polling attempt', attempts, '- status:', result.status)

        // 任务完成
        if (result.status === 'completed') {
          return {
            success: true,
            data: result.data,
            attempts,
          }
        }

        // 任务失败
        if (result.status === 'failed') {
          return {
            success: false,
            error: result.error || '任务处理失败',
            attempts,
          }
        }

        // 任务进行中，继续轮询
        if (result.status === 'pending' || result.status === 'processing') {
          await this.sleep(interval)
          continue
        }
      } catch (error) {
        console.error('[v0] Task polling error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : '轮询过程出错',
          attempts,
        }
      }
    }

    // 达到最大尝试次数
    return {
      success: false,
      error: `任务处理超时（已尝试 ${maxAttempts} 次）`,
      attempts,
    }
  }

  /**
   * 延迟指定时间
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 带指数退避的轮询（失败后逐渐增加间隔）
   */
  static async pollWithBackoff<T>(
    checker: TaskStatusChecker<T>,
    options: TaskPollingOptions = {}
  ): Promise<TaskPollingResult<T>> {
    const {
      interval = 2000,
      maxAttempts = 60,
      timeout = 120000,
      initialDelay = 1000,
    } = options

    if (initialDelay > 0) {
      await this.sleep(initialDelay)
    }

    const startTime = Date.now()
    let attempts = 0
    let currentInterval = interval

    while (attempts < maxAttempts) {
      attempts++

      if (Date.now() - startTime > timeout) {
        return {
          success: false,
          error: '任务处理超时',
          attempts,
        }
      }

      try {
        const result = await checker()

        if (result.status === 'completed') {
          return { success: true, data: result.data, attempts }
        }

        if (result.status === 'failed') {
          return {
            success: false,
            error: result.error || '任务处理失败',
            attempts,
          }
        }

        // 指数退避：每次失败后将间隔翻倍，但不超过 10 秒
        currentInterval = Math.min(currentInterval * 1.5, 10000)
        await this.sleep(currentInterval)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '轮询过程出错',
          attempts,
        }
      }
    }

    return {
      success: false,
      error: `任务处理超时（已尝试 ${maxAttempts} 次）`,
      attempts,
    }
  }
}
