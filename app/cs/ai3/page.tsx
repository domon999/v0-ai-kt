'use client'

import { useState } from 'react'

export default function AudioUploadTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInfo, setFileInfo] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const sizeInMB = (file.size / 1024 / 1024).toFixed(2)
      setFileInfo(`文件名: ${file.name}, 大小: ${sizeInMB}MB, 类型: ${file.type}`)
      console.log('[v0] File selected:', file.name, file.size, file.type)
    } else {
      setSelectedFile(null)
      setFileInfo('')
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setFileInfo('')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    if (input) input.value = ''
    console.log('[v0] File cleared')
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>音频文件上传测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label 
          htmlFor="audio-upload"
          style={{ 
            display: 'block', 
            marginBottom: '10px',
            fontWeight: '500'
          }}
        >
          选择音频文件:
        </label>
        <input
          id="audio-upload"
          type="file"
          accept=".mp3,.m4a,.wav,.mp4"
          onChange={handleFileChange}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />
      </div>

      {fileInfo && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>{fileInfo}</p>
        </div>
      )}

      {selectedFile && (
        <button
          onClick={handleClear}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          清除文件
        </button>
      )}
    </div>
  )
}
