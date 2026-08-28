import { useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type FlashyUser } from './auth-context-def'

interface StoredAccount extends FlashyUser {
  password: string
}

const USERS_KEY = 'flashy:mock-users'
const SESSION_KEY = 'flashy:mock-session'
const FAKE_LATENCY_MS = 500

function readUsers(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readSession(): FlashyUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as FlashyUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FlashyUser | null>(readSession)
  const isLoading = false

  const login = async (email: string, password: string) => {
    await wait(FAKE_LATENCY_MS)
    const account = readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!account || account.password !== password) {
      throw new Error('That email and password don\u2019t match an account.')
    }
    const profile: FlashyUser = { name: account.name, email: account.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
    setUser(profile)
  }

  const signup = async (name: string, email: string, password: string) => {
    await wait(FAKE_LATENCY_MS)
    const users = readUsers()
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }
    const account: StoredAccount = { name, email, password }
    writeUsers([...users, account])
    const profile: FlashyUser = { name, email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
    setUser(profile)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
