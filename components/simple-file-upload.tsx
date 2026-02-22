'use client'

/**
 * 简化版文件上传组件
 * 使用原生 HTML 和最小 JavaScript，避免 Shadcn 组件导致的冻结问题
 */

import { useState, useRef } from 'react'

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  label: string
  description?: string
}

export function SimpleFileUpload({
  onFileSelect,
  accept = '.mp3,.m4a,.wav',
  maxSizeMB = 20,
  label,
  description,
}: SimpleFileUploadProps) {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 立即设置文件名，不做其他操作
    setFileName(file.name)
    setError('')

    // 验证文件大小
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > maxSizeMB) {
      setError(`文件过大（${fileSizeMB.toFixed(1)}MB），最大支持 ${maxSizeMB}MB`)
      setFileName('')
      return
    }

    // 触发回调
    onFileSelect(file)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
        {label}
      </label>
      {description && (
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          {description}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      />
      {fileName && (
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          已选择：{fileName}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </div>
  )
}
