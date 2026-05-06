import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  userId: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, userId: string, email: string) => void
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('userEmail')

    if (token && userId && email) {
      setUser({ userId, email })
    }
    setIsLoading(false)
  }, [])

  const login = (token: string, userId: string, email: string) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('userId', userId)
    localStorage.setItem('userEmail', email)
    setUser({ userId, email })
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
