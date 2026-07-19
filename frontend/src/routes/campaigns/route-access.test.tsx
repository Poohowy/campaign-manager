import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { CampaignsRoute } from './route'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  session: null
  user: null
}

type CampaignsQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data: {
    data: unknown[]
  }
}

let authState: AuthState
let campaignsQueryState: CampaignsQueryState

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../features/campaigns/hooks/useCampaignsQuery', () => ({
  useCampaignsQuery: () => campaignsQueryState,
}))

describe('Campaigns access', () => {
  it('allows authenticated user to access campaigns page', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      session: null,
      user: null,
    }
    campaignsQueryState = {
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
          <CampaignsRoute />
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('No campaigns yet. Create your first campaign.')).toBeInTheDocument()
  })
})
