import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { CustomersPage } from './view'

type CustomersQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
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

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    session: { access_token: 'token' },
    user: null,
  }),
}))

vi.mock('../../features/customers/components/customer-import-dialog', () => ({
  CustomerImportDialog: ({
    onImportCompleted,
  }: {
    onImportCompleted: (result: { imported: number; updated: number; skipped: number }) => void
  }) => (
    <button onClick={() => onImportCompleted({ imported: 1, updated: 2, skipped: 3 })}>
      Import Customers
    </button>
  ),
}))

describe('CustomersPage', () => {
  it('shows empty state when no customers exist', () => {
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

    render(<CustomersPage />)

    expect(screen.getByText('Your customer list is currently empty.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import Customers' })).toBeInTheDocument()
  })

  it('shows import summary and refetches customers after import completion', () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    customersQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
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
    fireEvent.click(screen.getByRole('button', { name: 'Import Customers' }))

    expect(refetchMock).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText('Import completed. Imported: 1, Updated: 2, Skipped: 3.'),
    ).toBeInTheDocument()
  })
})
