'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Step1SelectVideo } from '@/components/wd/kbhc/step1-select-video'
import { Step2VoiceText } from '@/components/wd/kbhc/step2-voice-text'
import { Step3SelectBackground } from '@/components/wd/kbhc/step3-select-background'
import { Step4Synthesis } from '@/components/wd/kbhc/step4-synthesis'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function SynthesisPageClient() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [selectedVoice, setSelectedVoice] = useState<any>(null)
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [selectedBackground, setSelectedBackground] = useState<any>(null)

  const steps = [
    { number: 1, title: '选择视频' },
    { number: 2, title: '配置声音' },
    { number: 3, title: '选择背景' },
    { number: 4, title: '合成预览' },
  ]

  const handleStep2Continue = (voice: any, textValue: string, audio: string) => {
    setSelectedVoice(voice)
    setText(textValue)
    setAudioUrl(audio)
    setCurrentStep(3)
  }

  const handleSynthesisComplete = (workId: string) => {
    router.push(`/wd/zp?highlight=${workId}`)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedVideo !== null
      case 2:
        return selectedVoice !== null && text.trim() !== '' && audioUrl !== ''
      case 3:
        return selectedBackground !== null
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">口播视频合成</h1>
          <p className="text-muted-foreground">选择素材，AI 自动合成专业口播视频</p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                        currentStep >= step.number
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {step.number}
                    </div>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 h-0.5 w-12 transition-colors md:w-24 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <Step1SelectVideo
                onSelect={setSelectedVideo}
                selectedVideo={selectedVideo}
              />
            )}
            {currentStep === 2 && (
              <Step2VoiceText
                onContinue={handleStep2Continue}
                selectedVoice={selectedVoice}
                text={text}
              />
            )}
            {currentStep === 3 && (
              <Step3SelectBackground
                onSelect={setSelectedBackground}
                selectedBackground={selectedBackground}
              />
            )}
            {currentStep === 4 && (
              <Step4Synthesis
                data={{
                  video: selectedVideo,
                  voice: selectedVoice,
                  text,
                  audioUrl,
                  background: selectedBackground,
                }}
                onComplete={handleSynthesisComplete}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上一步
            </Button>
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              下一步
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
