import { createContext } from 'react'

export interface FlashyUser {
  name: string
  email: string
}

export interface AuthContextValue {
  user: FlashyUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
