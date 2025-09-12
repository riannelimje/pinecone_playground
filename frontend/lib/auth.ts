interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
}

interface AuthResponse {
  access_token: string
  token_type: string
}

interface User {
  id: string
  email: string
  name: string
}

const API_BASE_URL = "http://localhost:8000"

export class AuthService {
  private static TOKEN_KEY = "auth_token"

  static getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Login failed")
    }

    const data = await response.json()
    this.setToken(data.access_token)
    return data
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Registration failed")
    }

    const data = await response.json()
    this.setToken(data.access_token)
    return data
  }

  static async getCurrentUser(): Promise<User> {
    const token = this.getToken()
    if (!token) throw new Error("No token found")

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken()
        throw new Error("Token expired")
      }
      throw new Error("Failed to get user info")
    }

    return response.json()
  }

  static logout(): void {
    this.removeToken()
    window.location.href = "/login"
  }
}