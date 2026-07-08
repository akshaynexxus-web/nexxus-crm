import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthContextType } from '@/types'
import { api } from '@/services/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isValidUser(value: unknown): value is User {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as User).id === 'string' &&
      typeof (value as User).email === 'string' &&
      typeof (value as User).role === 'string'
  )
}

function readStoredUser() {
  const storedUser = localStorage.getItem('user')
  const token = localStorage.getItem('token')

  if (!storedUser || !token || token === 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }

  try {
    const parsedUser = JSON.parse(storedUser)
    if (isValidUser(parsedUser)) {
      return parsedUser
    }
  } catch {
    // Clear invalid auth state below.
  }

  localStorage.removeItem('user')
  localStorage.removeItem('token')
  return null
}

function readLoginPayload(data: any) {
  const payload = data?.user && data?.token ? data : data?.data
  if (!payload?.token || !isValidUser(payload.user)) {
    throw new Error('Login response was invalid. Redeploy the latest API build and try again.')
  }

  return {
    user: payload.user,
    token: String(payload.token),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(readStoredUser())
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = readLoginPayload(response.data)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  const forgotPassword = async (email: string) => {
    await api.post('/auth/forgot-password', { email })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
