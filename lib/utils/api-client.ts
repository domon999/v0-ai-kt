/**
 * 统一的 API 客户端，提供标准化的请求方法
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  timeout?: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, timeout = 30000 } = options

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body) {
      if (body instanceof FormData) {
        delete config.headers!['Content-Type']
        config.body = body
      } else {
        config.body = JSON.stringify(body)
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    config.signal = controller.signal

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config)
      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `请求失败: ${response.status}`,
        }
      }

      return {
        success: true,
        ...data,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: '请求超时，请稍后重试',
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: '网络错误，请检查连接',
      }
    }
  }

  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }
}

// 导出单例实例
export const apiClient = new ApiClient('/api')

// 导出类型供外部使用
export type { ApiResponse, RequestOptions }
