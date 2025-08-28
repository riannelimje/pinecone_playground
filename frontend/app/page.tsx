"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, HelpCircle, Loader2, Mic } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingType, setProcessingType] = useState<"notes" | "mcq" | null>(null)
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    }
  }

  const handleConvert = async (type: "notes" | "mcq") => {
    if (!selectedFile) return
    setIsProcessing(true)
    setProcessingType(type)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Adjust the endpoint as needed (e.g., http://localhost:8000/upload_pdf)
      const uploadRes = await fetch("http://localhost:8000/upload_pdf", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        setIsProcessing(false)
        setProcessingType(null)
        alert("Upload failed")
        return
      }

      const endpoint = type === "notes" ? "generate_notes" : "generate_mcq"
      const res = await fetch(`http://localhost:8000/${endpoint}`)
      const data = await res.json()

      if (type === "notes") {
        localStorage.setItem("convertedNotes", data.notes)
        router.push("/notes")
      } else {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">PDF to Notes & MCQ Converter</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your PDF documents into organized notes or interactive multiple-choice questions
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
                    {selectedFile ? selectedFile.name : "Click to upload PDF"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PDF files only, up to 10MB</p>
                </label>
              </div>
            </CardContent>
          </Card>

          {isProcessing && (
            <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      {processingType === "notes" ? "Converting PDF to Notes..." : "Generating MCQ Questions..."}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This may take a few moments. Please don't close this page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFile && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`hover:shadow-lg transition-all ${isProcessing ? "opacity-75" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Convert to Notes
                  </CardTitle>
                  <CardDescription>Extract and organize key information into readable notes</CardDescription>
                </CardHeader>
                <CardContent>
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

              <Card className={`hover:shadow-lg transition-all ${isProcessing ? "opacity-75" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-green-600" />
                    Convert to MCQ
                  </CardTitle>
                  <CardDescription>Create interactive multiple-choice questions for study</CardDescription>
                </CardHeader>
                <CardContent>
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
  )
}