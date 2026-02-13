/**
 * 验证工具函数
 */

/**
 * 验证必填字段
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  const missing = fields.filter((field) => !data[field])

  if (missing.length > 0) {
    return {
      valid: false,
      missing: missing.map(String),
    }
  }

  return { valid: true }
}

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型：${file.type}。允许的类型：${allowedTypes.join(', ')}`,
    }
  }
  return { valid: true }
}

/**
 * 验证文件大小（单位：字节）
 */
export function validateFileSize(
  file: File,
  maxSize: number
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(2)
    const actualMB = (file.size / 1024 / 1024).toFixed(2)
    return {
      valid: false,
      error: `文件过大：${actualMB}MB。最大允许：${maxMB}MB`,
    }
  }
  return { valid: true }
}

/**
 * 验证图片文件
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number // 默认 10MB
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'] } =
    options

  // 验证类型
  const typeCheck = validateFileType(file, allowedTypes)
  if (!typeCheck.valid) return typeCheck

  // 验证大小
  const sizeCheck = validateFileSize(file, maxSize)
  if (!sizeCheck.valid) return sizeCheck

  return { valid: true }
}

/**
 * 验证视频文件
 */
export function validateVideoFile(
  file: File,
  options: {
    maxSize?: number // 默认 100MB
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 100 * 1024 * 1024, allowedTypes = ['video/mp4', 'video/webm'] } = options

  const typeCheck = validateFileType(file, allowedTypes)
  if (!typeCheck.valid) return typeCheck

  const sizeCheck = validateFileSize(file, maxSize)
  if (!sizeCheck.valid) return sizeCheck

  return { valid: true }
}

/**
 * 验证音频文件
 */
export function validateAudioFile(
  file: File,
  options: {
    maxSize?: number // 默认 50MB
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 50 * 1024 * 1024,
    allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'],
  } = options

  const typeCheck = validateFileType(file, allowedTypes)
  if (!typeCheck.valid) return typeCheck

  const sizeCheck = validateFileSize(file, maxSize)
  if (!sizeCheck.valid) return sizeCheck

  return { valid: true }
}

/**
 * 验证文本长度
 */
export function validateTextLength(
  text: string,
  options: {
    min?: number
    max?: number
  }
): { valid: boolean; error?: string } {
  const { min, max } = options

  if (min !== undefined && text.length < min) {
    return {
      valid: false,
      error: `文本过短，至少需要 ${min} 个字符`,
    }
  }

  if (max !== undefined && text.length > max) {
    return {
      valid: false,
      error: `文本过长，最多允许 ${max} 个字符`,
    }
  }

  return { valid: true }
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url)
    return { valid: true }
  } catch {
    return {
      valid: false,
      error: '无效的 URL 格式',
    }
  }
}

/**
 * 验证 UUID 格式
 */
export function validateUuid(uuid: string): { valid: boolean; error?: string } {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    return {
      valid: false,
      error: '无效的 UUID 格式',
    }
  }
  return { valid: true }
}
