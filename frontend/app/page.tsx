"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, HelpCircle, Loader2, Mic, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingType, setProcessingType] = useState<"notes" | "mcq" | null>(null)
  const [hasUploadedFile, setHasUploadedFile] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const router = useRouter()

  useEffect(() => {
    const savedFileName = localStorage.getItem("uploadedFileName")
    if (savedFileName) {
      setHasUploadedFile(true)
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      localStorage.setItem("uploadedFileName", file.name)
      setHasUploadedFile(true)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setHasUploadedFile(false)
    localStorage.removeItem("uploadedFileName")
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleConvert = async (type: "notes" | "mcq") => {
    if (!selectedFile && !hasUploadedFile) return
    setIsProcessing(true)
    setProcessingType(type)

    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadRes = await fetch("https://pinecone-playground.onrender.com/upload_pdf", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          setIsProcessing(false)
          setProcessingType(null)
          alert("Upload failed")
          return
        }
      }

      if (type === "notes") {
        const res = await fetch("https://pinecone-playground.onrender.com/generate_notes")
        const data = await res.json()
        localStorage.setItem("convertedNotes", data.notes)
        router.push("/notes")
      } else {
        const res = await fetch("https://pinecone-playground.onrender.com/generate_mcq", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            difficulty_level: difficulty,
          }),
        })
        console.log(difficulty)
        const data = await res.json()
        localStorage.setItem("convertedMCQ", JSON.stringify(data.mcq))
        router.push("/mcq")
      }
    } catch (error) {
      console.error("Conversion failed:", error)
      alert("Conversion failed. Please try again.")
    }

    setIsProcessing(false)
    setProcessingType(null)
  }

  const getFileName = () => {
    if (selectedFile) return selectedFile.name
    return localStorage.getItem("uploadedFileName") || "Previously uploaded file"
  }

  return (
    <AuthGuard>
      <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">PDF to Notes & MCQ Converter</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your PDF documents into organised notes or interactive multiple-choice questions
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => router.push("/transcribe")} className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Try Speech to Text
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload PDF Document
              </CardTitle>
              <CardDescription>Select a PDF file to convert into notes or MCQ format</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-opacity ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="pdf-upload" className={`cursor-pointer ${isProcessing ? "cursor-not-allowed" : ""}`}>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {selectedFile || hasUploadedFile ? getFileName() : "Click to upload PDF"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PDF files only, up to 10MB</p>
                </label>
                {(selectedFile || hasUploadedFile) && !isProcessing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    className="mt-4 flex items-center gap-2 mx-auto bg-transparent"
                  >
                    <X className="h-4 w-4" />
                    Upload Different File
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {(selectedFile || hasUploadedFile) && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`hover:shadow-lg transition-all flex flex-col ${isProcessing ? "opacity-75" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Convert to Notes
                  </CardTitle>
                  <CardDescription>Extract and organize key information into readable notes</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4 flex-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 opacity-0">
                      Placeholder
                    </div>
                    <div className="flex gap-4 h-6">
                      <div className="opacity-0">Spacer content</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConvert("notes")}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing && processingType === "notes" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      "Generate Notes"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className={`hover:shadow-lg transition-all flex flex-col ${isProcessing ? "opacity-75" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-green-600" />
                    Convert to MCQ
                  </CardTitle>
                  <CardDescription>Create interactive multiple-choice questions for study</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4 flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      Difficulty Level
                    </label>
                    <div className="flex gap-4">
                      {(["easy", "medium", "hard"] as const).map((level) => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="difficulty"
                            value={level}
                            checked={difficulty === level}
                            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                            className="text-green-600 focus:ring-green-500"
                            disabled={isProcessing}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConvert("mcq")}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isProcessing && processingType === "mcq" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate MCQ"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}