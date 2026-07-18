import { useContext } from 'react'
import { AuthContext } from '../components/auth-context'
import type { AuthContextValue } from '../types/auth-context'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}
