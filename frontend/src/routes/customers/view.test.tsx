import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { CustomersPage } from './view'

const { deleteCustomersMock } = vi.hoisted(() => ({
  deleteCustomersMock: vi.fn(),
}))

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

vi.mock('../../features/customers/api/customer-client', () => {
  class CustomersApiError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    CustomersApiError,
    deleteCustomers: deleteCustomersMock,
  }
})

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
  beforeEach(() => {
    deleteCustomersMock.mockReset()
  })

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

    expect(screen.getByText(/Your customer list is currently empty\./)).toBeInTheDocument()
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

  it('supports row selection, selection summary and import button visibility', () => {
    customersQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: [
          {
            id: 'c-1',
            company_name: 'ACME',
            contact_name: 'Alice',
            email: 'alice@acme.com',
            phone: null,
            external_id: 'ext-1',
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      },
    }

    render(<CustomersPage />)

    expect(screen.getByRole('button', { name: 'Import Customers' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Selected' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('ACME'))

    expect(screen.getByText('1 customer selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Import Customers' })).not.toBeInTheDocument()
  })

  it('supports select all, deselect all and indeterminate state', () => {
    customersQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: [
          {
            id: 'c-1',
            company_name: 'ACME',
            contact_name: 'Alice',
            email: 'alice@acme.com',
            phone: null,
            external_id: 'ext-1',
          },
          {
            id: 'c-2',
            company_name: 'Globex',
            contact_name: 'Bob',
            email: 'bob@globex.com',
            phone: null,
            external_id: 'ext-2',
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      },
    }

    render(<CustomersPage />)

    fireEvent.click(screen.getByText('ACME'))
    const headerCheckbox = screen.getByLabelText('Select all customers')
    expect(headerCheckbox).toHaveAttribute('data-state', 'indeterminate')

    fireEvent.click(headerCheckbox)
    expect(screen.getByText('2 customers selected')).toBeInTheDocument()
    expect(headerCheckbox).toHaveAttribute('data-state', 'checked')

    fireEvent.click(headerCheckbox)
    expect(screen.queryByText('2 customers selected')).not.toBeInTheDocument()
    expect(headerCheckbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('deletes selected customers after confirmation and refreshes list', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    deleteCustomersMock.mockResolvedValueOnce({
      data: {
        deleted: 2,
      },
    })
    customersQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: {
        data: [
          {
            id: 'c-1',
            company_name: 'ACME',
            contact_name: 'Alice',
            email: 'alice@acme.com',
            phone: null,
            external_id: 'ext-1',
          },
          {
            id: 'c-2',
            company_name: 'Globex',
            contact_name: 'Bob',
            email: 'bob@globex.com',
            phone: null,
            external_id: 'ext-2',
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      },
    }

    render(<CustomersPage />)

    fireEvent.click(screen.getByLabelText('Select all customers'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Selected' }))

    expect(screen.getByText('Delete Customers')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(deleteCustomersMock).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('2 customers deleted successfully.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import Customers' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete Selected' })).not.toBeInTheDocument()
  })
})
