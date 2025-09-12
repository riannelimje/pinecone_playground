"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Download, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"

export default function NotesPage() {
  const [notes, setNotes] = useState<string>("")
  const [showCopyModal, setShowCopyModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedNotes = localStorage.getItem("convertedNotes")
    if (savedNotes) {
      setNotes(savedNotes)
    } else {
      router.push("/")
    }
  }, [router])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes)
      setShowCopyModal(true)
      // Auto-close modal after 2 seconds
      setTimeout(() => setShowCopyModal(false), 2000)
    } catch (err) {
      console.error("Failed to copy notes:", err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "converted-notes.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!notes) return null

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Converted Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">{children}</h3>
                    ),
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                    ),
                  }}
                >
                  {notes}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Text Copied!
            </DialogTitle>
            <DialogDescription>Your notes have been successfully copied to the clipboard.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  </AuthGuard>
  )
}