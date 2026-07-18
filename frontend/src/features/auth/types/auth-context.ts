import type { Session, User } from '@supabase/supabase-js'

export type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
}
