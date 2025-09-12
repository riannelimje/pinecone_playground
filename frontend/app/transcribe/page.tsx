"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mic, MicOff, Copy, Download, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function TranscribePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " "
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      setShowCopyModal(true)
      setTimeout(() => setShowCopyModal(false), 2000)
    } catch (err) {
      console.error("Failed to copy transcript:", err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transcript.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearTranscript = () => {
    setTranscript("")
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Speech Recognition Not Supported</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your browser doesn't support speech recognition. Please try using Chrome or Edge.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard>
      <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            {transcript && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={clearTranscript}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Speech to Text</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <Button
                    size="lg"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-32 h-32 rounded-full ${
                      isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
                  </Button>
                </div>
                <p className="text-lg font-medium mb-2">{isRecording ? "Recording..." : "Click to start recording"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isRecording
                    ? "Speak clearly into your microphone. Click the button again to stop."
                    : "Make sure your microphone is enabled and speak clearly."}
                </p>
              </CardContent>
            </Card>

            {/* Transcript Display */}
            {transcript && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {transcript || "Your transcribed text will appear here..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Copy confirmation modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-green-500" />
              Text Copied!
            </DialogTitle>
            <DialogDescription>Your transcript has been successfully copied to the clipboard.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
    </AuthGuard>
  )
}