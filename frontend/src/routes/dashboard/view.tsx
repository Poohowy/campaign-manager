import { useState } from 'react'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { signOut } from '../../features/auth/api/auth-client'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function DashboardPage() {
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogout = async () => {
    setErrorMessage(null)
    setIsSigningOut(true)

    const result = await signOut()

    if (!result.success) {
      setErrorMessage(result.message)
    }

    setIsSigningOut(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Authentication is active and your protected workspace is available.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">Signed in as</p>
          <p className="text-base text-slate-900">{user?.email ?? 'Unknown user'}</p>
        </div>
        <Button
          onClick={() => {
            void handleLogout()
          }}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <Spinner />
              Logging out...
            </>
          ) : (
            'Logout'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
