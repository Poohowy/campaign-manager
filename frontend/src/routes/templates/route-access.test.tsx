import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { TemplatesRoute } from './route'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  session: null
  user: null
}

type TemplatesQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data: {
    data: unknown[]
  }
}

let authState: AuthState
let templatesQueryState: TemplatesQueryState

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../features/templates/hooks/useTemplatesQuery', () => ({
  useTemplatesQuery: () => templatesQueryState,
}))

describe('Templates access', () => {
  it('allows authenticated user to access templates page', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      session: null,
      user: null,
    }
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: [],
      },
    }

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TemplatesRoute />
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('No templates yet. Create your first template.')).toBeInTheDocument()
  })
})
