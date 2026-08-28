import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context-def'
import * as api from '../lib/api'
import type { FlashyUser } from '../lib/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FlashyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // check for an existing session cookie on load
  useEffect(() => {
    api
      .fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { user } = await api.login(email, password)
    setUser(user)
  }

  const signup = async (name: string, email: string, password: string) => {
    const { user } = await api.signup(name, email, password)
    setUser(user)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  const value = useMemo(() => ({ user, isLoading, login, signup, logout }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}