"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CaptchaProps {
  value: string
  onChange: (value: string) => void
  onValidate: (isValid: boolean) => void
  refreshTrigger?: number
}

export function Captcha({ value, onChange, onValidate, refreshTrigger }: CaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captchaText, setCaptchaText] = useState("")

  const generateCaptcha = () => {
    // 生成 4 位随机数字
    const text = Math.floor(1000 + Math.random() * 9000).toString()
    setCaptchaText(text)
    drawCaptcha(text)
  }

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制背景
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // 绘制验证码文字
    ctx.font = "bold 32px Arial"
    ctx.textBaseline = "middle"

    for (let i = 0; i < text.length; i++) {
      ctx.save()

      const x = 20 + i * 30
      const y = canvas.height / 2
      const rotation = (Math.random() - 0.5) * 0.4

      ctx.translate(x, y)
      ctx.rotate(rotation)

      const hue = Math.random() * 360
      ctx.fillStyle = `hsl(${hue}, 70%, 40%)`

      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }

    // 绘制干扰点
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
    }
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      generateCaptcha()
      onChange("")
    }
  }, [refreshTrigger, onChange])

  useEffect(() => {
    onValidate(value === captchaText)
  }, [value, captchaText, onValidate])

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">验证码</Label>
      <div className="flex items-center gap-2">
        <canvas
          ref={canvasRef}
          width={140}
          height={50}
          className="rounded border border-gray-300 dark:border-gray-600"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={generateCaptcha} 
          title="刷新验证码"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        id="captcha"
        type="text"
        maxLength={4}
        placeholder="请输入验证码"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  )
}
