import { createContext } from 'react'
import type { AuthContextValue } from '../types/auth-context'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
