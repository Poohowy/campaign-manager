import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { CustomersRoute } from './route'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  session: null
  user: null
}

type CustomersQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data: {
    data: unknown[]
    pagination: {
      page: number
      page_size: number
      total: number
      total_pages: number
    }
  }
}

let authState: AuthState
let customersQueryState: CustomersQueryState

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../features/customers/hooks/useCustomersQuery', () => ({
  useCustomersQuery: () => customersQueryState,
}))

describe('Customers access', () => {
  it('allows authenticated user to access customers page', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      session: null,
      user: null,
    }
    customersQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      },
    }

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <CustomersRoute />
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Your customer list is currently empty.')).toBeInTheDocument()
  })
})
