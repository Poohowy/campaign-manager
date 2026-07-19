import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CustomersPage } from './view'

type CustomersQueryState = {
  isLoading: boolean
  isError: boolean
  data?: {
    data: unknown[]
    pagination: {
      page: number
      page_size: number
      total: number
      total_pages: number
    }
  }
}

let customersQueryState: CustomersQueryState

vi.mock('../../features/customers/hooks/useCustomersQuery', () => ({
  useCustomersQuery: () => customersQueryState,
}))

describe('CustomersPage', () => {
  it('shows empty state when no customers exist', () => {
    customersQueryState = {
      isLoading: false,
      isError: false,
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

    render(<CustomersPage />)

    expect(screen.getByText('Your customer list is currently empty.')).toBeInTheDocument()
  })
})
