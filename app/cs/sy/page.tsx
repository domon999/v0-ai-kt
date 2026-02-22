import { TTSTestClient } from './tts-test-client'
import { DebugPanel } from '@/components/debug-panel'

export const metadata = {
  title: 'MiniMax TTS 测试',
  description: 'MiniMax 语音合成测试页面',
}

export default function TTSTestPage() {
  return (
    <>
      <TTSTestClient />
      <DebugPanel />
    </>
  )
}
