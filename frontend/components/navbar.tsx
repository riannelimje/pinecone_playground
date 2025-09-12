"use client"

import { Button } from "@/components/ui/button"
import { FileText, LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <FileText className="h-6 w-6 text-blue-600" />
          PDF Converter
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                {user.name}
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}