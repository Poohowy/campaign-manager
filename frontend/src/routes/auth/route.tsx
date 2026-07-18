import { AppShell } from '../../components/layout/AppShell'
import { AuthGatewayPage } from './view'

export function AuthRoute() {
  return (
    <AppShell>
      <AuthGatewayPage />
    </AppShell>
  )
}
