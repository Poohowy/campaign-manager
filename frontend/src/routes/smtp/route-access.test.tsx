import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { SmtpRoute } from './route'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  session: null
  user: null
}

type SmtpQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data: {
    data: null
  }
}

let authState: AuthState
let smtpQueryState: SmtpQueryState

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../features/smtp/hooks/useSmtpSettingsQuery', () => ({
  useSmtpSettingsQuery: () => smtpQueryState,
}))

describe('SMTP access', () => {
  it('allows authenticated user to access smtp settings page', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      session: null,
      user: null,
    }
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: null,
      },
    }

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <SmtpRoute />
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('SMTP Settings')).toBeInTheDocument()
  })
})
