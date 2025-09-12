"use client"

import { useState, useEffect } from "react"
import { AuthService } from "@/lib/auth"

interface User {
  id: string
  email: string
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const userData = await AuthService.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        AuthService.removeToken()
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      await AuthService.login({ email, password })
      const userData = await AuthService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      await AuthService.register({ email, password, name })
      const userData = await AuthService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" }
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  }
}