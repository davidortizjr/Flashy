import { createContext } from 'react'
import type { FlashyUser } from '../lib/api'

export type { FlashyUser }

export interface AuthContextValue {
  user: FlashyUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)