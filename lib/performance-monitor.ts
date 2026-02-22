/**
 * Performance monitoring utilities to track freezing issues
 */

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map()
  private static logs: string[] = []

  /**
   * Start tracking a specific operation
   */
  static start(label: string) {
    const timestamp = performance.now()
    this.measurements.set(label, timestamp)
    this.log(`⏱️ START: ${label}`)
  }

  /**
   * End tracking and log duration
   */
  static end(label: string) {
    const startTime = this.measurements.get(label)
    if (!startTime) {
      this.log(`⚠️ END called without START: ${label}`)
      return
    }

    const duration = performance.now() - startTime
    this.measurements.delete(label)
    
    // Warn if operation took more than 100ms
    const emoji = duration > 100 ? '🐌' : '✅'
    this.log(`${emoji} END: ${label} (${duration.toFixed(2)}ms)`)

    if (duration > 100) {
      console.warn(`[v0 PERF] Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * Log a message with timestamp
   */
  static log(message: string) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1)
    const logMessage = `[${timestamp}] ${message}`
    this.logs.push(logMessage)
    console.log(`[v0 PERF] ${logMessage}`)
  }

  /**
   * Get all logs
   */
  static getLogs(): string[] {
    return [...this.logs]
  }

  /**
   * Clear all logs and measurements
   */
  static clear() {
    this.measurements.clear()
    this.logs = []
    this.log('🧹 Monitor cleared')
  }

  /**
   * Track file selection with detailed info
   */
  static trackFileSelection(file: File | null, inputId: string) {
    if (!file) {
      this.log(`📂 ${inputId}: No file selected`)
      return
    }

    const sizeMB = (file.size / 1024 / 1024).toFixed(2)
    this.log(`📂 ${inputId}: ${file.name} (${sizeMB}MB, ${file.type})`)

    // Warn if file is large
    if (file.size > 20 * 1024 * 1024) {
      console.warn(`[v0 PERF] Large file warning: ${file.name} is ${sizeMB}MB`)
    }
  }

  /**
   * Track React renders
   */
  static trackRender(componentName: string, props?: any) {
    const propsInfo = props ? ` props=${JSON.stringify(Object.keys(props))}` : ''
    this.log(`🔄 RENDER: ${componentName}${propsInfo}`)
  }
}

/**
 * Hook to track component renders
 */
export function useRenderTracking(componentName: string) {
  if (typeof window !== 'undefined') {
    PerformanceMonitor.trackRender(componentName)
  }
}
