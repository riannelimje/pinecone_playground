"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NotesPage() {
  const [notes, setNotes] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

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
      toast({
        title: "Copied!",
        description: "Notes copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy notes",
        variant: "destructive",
      })
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
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{notes}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
