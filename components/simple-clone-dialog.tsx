'use client'

/**
 * 简化版音色克隆对话框
 * 使用原生方式实现，避免复杂组件导致的冻结问题
 */

import { useState } from 'react'

interface SimpleCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customApiKey: string
  customGroupId: string
  onCloneStart: (data: {
    cloneFile: File
    clonePromptFile: File | null
    clonePromptText: string
    cloneVoiceId: string
    cloneVoiceName: string
  }) => Promise<void>
  onCloneSuccess: (voiceId: string) => void
}

export function SimpleCloneDialog({
  open,
  onOpenChange,
  customApiKey,
  customGroupId,
  onCloneStart,
  onCloneSuccess,
}: SimpleCloneDialogProps) {
  const [step, setStep] = useState(1)
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [promptFile, setPromptFile] = useState<File | null>(null)
  const [promptText, setPromptText] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [voiceName, setVoiceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleNext = async () => {
    if (step === 1) {
      if (!cloneFile) {
        setError('请选择待克隆音频')
        return
      }
      setStep(2)
      setError('')
    } else if (step === 2) {
      if (!voiceId.trim()) {
        setError('请输入自定义 Voice ID')
        return
      }
      if (!voiceName.trim()) {
        setError('请输入声音名称')
        return
      }

      setLoading(true)
      setError('')

      try {
        await onCloneStart({
          cloneFile,
          clonePromptFile: promptFile,
          clonePromptText: promptText,
          cloneVoiceId: voiceId,
          cloneVoiceName: voiceName,
        })
        setStep(3)
      } catch (e: any) {
        setError(e.message || '克隆失败')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClose = () => {
    setStep(1)
    setCloneFile(null)
    setPromptFile(null)
    setPromptText('')
    setVoiceId('')
    setVoiceName('')
    setError('')
    onOpenChange(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(voiceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    maxWidth: '512px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  }

  const headerStyle: React.CSSProperties = {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
  }

  const bodyStyle: React.CSSProperties = {
    padding: '24px',
    minHeight: '200px',
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '8px',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  }

  const buttonPrimaryStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
  }

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  }

  return (
    <div style={dialogStyle} onClick={handleClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* 标题 */}
        <div style={headerStyle}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
            {step === 1 && '第一步：上传克隆音频'}
            {step === 2 && '第二步：确认克隆参数'}
            {step === 3 && '克隆成功'}
          </h2>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            {step === 1 && '上传一段包含目标声音的音频文件（10秒-5分钟）'}
            {step === 2 && '填写自定义 Voice ID 和声音名称'}
            {step === 3 && '声音克隆已完成，现在可以在上方的语音合成中使用'}
          </p>
        </div>

        {/* 内容 */}
        <div style={bodyStyle}>
          {step === 1 && (
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                待克隆音频
              </label>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                支持 mp3、m4a、wav 格式，时长 10秒-5分钟，最大 20MB
              </p>
              <input
                type="file"
                accept=".mp3,.m4a,.wav"
                onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                style={inputStyle}
              />
              {cloneFile && (
                <p style={{ fontSize: '12px', color: '#666' }}>
                  已选择: {cloneFile.name}
                </p>
              )}

              <label style={{ display: 'block', marginTop: '16px', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                示例音频（可选）
              </label>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                支持 mp3、m4a、wav 格式，时长小于 8秒，最大 20MB
              </p>
              <input
                type="file"
                accept=".mp3,.m4a,.wav"
                onChange={(e) => setPromptFile(e.target.files?.[0] || null)}
                style={inputStyle}
              />
              {promptFile && (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    已选择: {promptFile.name}
                  </p>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="输入示例音频的文本内容"
                    style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                自定义 Voice ID（必填）
              </label>
              <input
                type="text"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="例如: my-voice-001"
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
                输入一个唯一的 Voice ID，用于标识这个克隆声音
              </p>

              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                声音名称（必填）
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="例如: 张三的声音"
                style={inputStyle}
              />

              <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '4px', marginTop: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>克隆信息：</p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  音频: {cloneFile?.name}
                </p>
                {promptFile && (
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                    示例音频: {promptFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: '#15803d' }}>
                  ✓ 声音克隆成功！
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#166534' }}>
                  现在可以在上方的语音合成中使用这个声音了
                </p>
              </div>

              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                新 Voice ID
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={voiceId}
                  disabled
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    ...buttonStyle,
                    flex: 0,
                    padding: '8px 12px',
                  }}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                复制此 Voice ID 并在上方的声音选择中使用
              </p>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginTop: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div style={footerStyle}>
          <button onClick={handleClose} style={buttonStyle}>
            {step === 3 ? '完成' : '取消'}
          </button>
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={loading || (step === 1 && !cloneFile)}
              style={loading || (step === 1 && !cloneFile) ? buttonDisabledStyle : buttonPrimaryStyle}
            >
              {loading ? '处理中...' : step === 1 ? '下一步' : '开始克隆'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
