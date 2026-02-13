import { NextResponse } from 'next/server'

/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

/**
 * API 响应工具类
 */
export class ApiResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
    })
  }

  /**
   * 错误响应
   */
  static error(error: string, code?: string, status: number = 400): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error,
        code,
      },
      { status }
    )
  }

  /**
   * 未授权响应
   */
  static unauthorized(message: string = '未授权访问'): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  /**
   * 积分不足响应
   */
  static insufficientCredits(
    required: number,
    current: number
  ): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: `积分不足，需要 ${required} 积分，当前余额 ${current} 积分`,
        code: 'INSUFFICIENT_CREDITS',
        data: { required, current },
      },
      { status: 402 }
    )
  }

  /**
   * 参数验证失败响应
   */
  static validationError(message: string): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    )
  }

  /**
   * 服务器错误响应
   */
  static serverError(message: string = '服务器错误'): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }

  /**
   * 任务创建成功响应
   */
  static taskCreated(taskId: string, message?: string): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: true,
      data: { taskId },
      message: message || '任务已创建',
    })
  }

  /**
   * 任务处理中响应
   */
  static taskProcessing(taskId: string, progress?: number): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status: 'processing',
        progress,
      },
      message: '任务处理中',
    })
  }

  /**
   * 任务完成响应
   */
  static taskCompleted<T>(result: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data: result,
      message: message || '任务已完成',
    })
  }
}
