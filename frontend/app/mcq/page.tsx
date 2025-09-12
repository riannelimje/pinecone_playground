"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"

interface Question {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface MCQData {
  questions: Question[]
}

export default function MCQPage() {
  const [mcqData, setMcqData] = useState<MCQData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [isQuizComplete, setIsQuizComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedMCQ = localStorage.getItem("convertedMCQ")
    if (savedMCQ && savedMCQ !== "undefined") {
      try {
        const data = JSON.parse(savedMCQ)
        if (data && data.questions && Array.isArray(data.questions)) {
          setMcqData(data)
          setUserAnswers(new Array(data.questions.length).fill(""))
        } else {
          console.error("Invalid MCQ data structure")
          router.push("/")
        }
      } catch (error) {
        console.error("Failed to parse MCQ data:", error)
        localStorage.removeItem("convertedMCQ") // Clear invalid data
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [router])

  const currentQuestion = mcqData?.questions[currentQuestionIndex]

  const handleAnswerSelect = (option: string) => {
    if (showResult) return
    setSelectedAnswer(option)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return

    const newUserAnswers = [...userAnswers]
    newUserAnswers[currentQuestionIndex] = selectedAnswer
    setUserAnswers(newUserAnswers)
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestionIndex < (mcqData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null)
      setShowResult(!!userAnswers[currentQuestionIndex + 1])
    } else {
      setIsQuizComplete(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || null)
      setShowResult(!!userAnswers[currentQuestionIndex - 1])
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setUserAnswers(new Array(mcqData?.questions.length || 0).fill(""))
    setIsQuizComplete(false)
  }

  const getScore = () => {
    if (!mcqData) return { correct: 0, total: 0 }
    const correct = userAnswers.filter((answer, index) => answer === mcqData.questions[index].answer).length
    return { correct, total: mcqData.questions.length }
  }

  if (!mcqData || !currentQuestion) return null

  if (isQuizComplete) {
    const { correct, total } = getScore()
    const percentage = Math.round((correct / total) * 100)

    return (
      <AuthGuard>
        <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl mb-4">Quiz Complete!</CardTitle>
                <div className="text-6xl mb-4">{percentage >= 70 ? "🎉" : percentage >= 50 ? "👍" : "📚"}</div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {correct}/{total}
                  </div>
                  <div className="text-lg text-gray-600 dark:text-gray-300">{percentage}% Correct</div>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleRestart} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Badge variant="secondary" className="text-sm">
              Question {currentQuestionIndex + 1} of {mcqData.questions.length}
            </Badge>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option
                  const isCorrect = option === currentQuestion.answer
                  const isWrong = showResult && isSelected && !isCorrect

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
                        "hover:border-purple-300 dark:hover:border-purple-600",
                        isSelected && !showResult && "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                        showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                        isWrong && "border-red-500 bg-red-50 dark:bg-red-900/20",
                        !isSelected && !showResult && "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 dark:text-gray-200">{option}</span>
                        {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {isWrong && <XCircle className="h-5 w-5 text-red-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {showResult && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
                  <p className="text-blue-700 dark:text-blue-300">{currentQuestion.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>

            <div className="flex gap-2">
              {!showResult && selectedAnswer && <Button onClick={handleSubmitAnswer}>Submit Answer</Button>}

              {showResult && (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  {currentQuestionIndex === mcqData.questions.length - 1 ? "Finish Quiz" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>
                {Math.round(((currentQuestionIndex + (showResult ? 1 : 0)) / mcqData.questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + (showResult ? 1 : 0)) / mcqData.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}