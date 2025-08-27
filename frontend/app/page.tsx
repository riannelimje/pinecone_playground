"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
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

    // Upload the PDF
    const formData = new FormData()
    formData.append("file", selectedFile)

    // Adjust the endpoint as needed (e.g., http://localhost:8000/upload_pdf)
    const uploadRes = await fetch("http://localhost:8000/upload_pdf", {
      method: "POST",
      body: formData,
    })

    if (!uploadRes.ok) {
      setIsProcessing(false)
      alert("Upload failed")
      return
    }

    // Get notes or MCQ
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

    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">PDF to Notes & MCQ Converter</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your PDF documents into organized notes or interactive multiple-choice questions
          </p>
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
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {selectedFile ? selectedFile.name : "Click to upload PDF"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PDF files only, up to 10MB</p>
                </label>
              </div>
            </CardContent>
          </Card>

          {selectedFile && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? "Processing..." : "Generate Notes"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
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
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? "Processing..." : "Generate MCQ"}
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
