import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { Spinner } from '../../../components/ui/spinner'
import { useAuth } from '../hooks/useAuth'

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600" role="status">
        <Spinner className="mr-2" />
        Initializing session...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
