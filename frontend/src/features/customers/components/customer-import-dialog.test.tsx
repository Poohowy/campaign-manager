import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CustomerImportDialog } from './customer-import-dialog'

const { fetchCustomerImportPreviewMock, importCustomersMock } = vi.hoisted(() => ({
  fetchCustomerImportPreviewMock: vi.fn(),
  importCustomersMock: vi.fn(),
}))

vi.mock('../api/customer-client', () => {
  class CustomersApiError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    CustomersApiError,
    fetchCustomerImportPreview: fetchCustomerImportPreviewMock,
    importCustomers: importCustomersMock,
  }
})

describe('CustomerImportDialog', () => {
  beforeEach(() => {
    fetchCustomerImportPreviewMock.mockReset()
    importCustomersMock.mockReset()
  })

  it('validates file selection before upload', () => {
    render(<CustomerImportDialog accessToken="token" onImportCompleted={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Import Customers' }))
    fireEvent.click(screen.getByRole('button', { name: 'Upload and Preview' }))

    expect(screen.getByText('Please select a CSV file before uploading.')).toBeInTheDocument()
  })

  it('imports successfully after required mappings are selected', async () => {
    fetchCustomerImportPreviewMock.mockResolvedValueOnce({
      data: {
        headers: ['external_id', 'company_name', 'email', 'phone'],
        preview: [
          {
            external_id: 'ext-1',
            company_name: 'ACME',
            email: 'hello@acme.com',
            phone: '123-456',
          },
        ],
        row_count: 1,
      },
    })
    importCustomersMock.mockResolvedValueOnce({
      data: { imported: 1, updated: 0, skipped: 0 },
    })
    const onImportCompleted = vi.fn()

    render(<CustomerImportDialog accessToken="token" onImportCompleted={onImportCompleted} />)

    fireEvent.click(screen.getByRole('button', { name: 'Import Customers' }))

    const fileInput = screen.getByLabelText('CSV File')
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['external_id,company_name,email,phone'], 'customers.csv', { type: 'text/csv' })],
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Upload and Preview' }))

    await screen.findByText('Detected columns')

    const continueButton = screen.getByRole('button', { name: 'Continue' })
    expect(continueButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('External ID (required)'), {
      target: { value: 'external_id' },
    })
    fireEvent.change(screen.getByLabelText('Company Name (required)'), {
      target: { value: 'company_name' },
    })
    fireEvent.change(screen.getByLabelText('Email (required)'), {
      target: { value: 'email' },
    })

    expect(continueButton).toBeEnabled()

    fireEvent.click(continueButton)
    await screen.findByRole('button', { name: 'Import Customers' })

    expect(importCustomersMock).toHaveBeenCalledTimes(1)
    expect(onImportCompleted).toHaveBeenCalledWith({ imported: 1, updated: 0, skipped: 0 })
  })

  it('shows loading state while import is running', async () => {
    fetchCustomerImportPreviewMock.mockResolvedValueOnce({
      data: {
        headers: ['external_id', 'company_name', 'email'],
        preview: [{ external_id: 'ext-1', company_name: 'ACME', email: 'hello@acme.com' }],
        row_count: 1,
      },
    })
    importCustomersMock.mockImplementation(() => new Promise(() => {}))

    render(<CustomerImportDialog accessToken="token" onImportCompleted={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Import Customers' }))
    fireEvent.change(screen.getByLabelText('CSV File'), {
      target: {
        files: [new File(['external_id,company_name,email'], 'customers.csv', { type: 'text/csv' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload and Preview' }))
    await screen.findByText('Detected columns')

    fireEvent.change(screen.getByLabelText('External ID (required)'), {
      target: { value: 'external_id' },
    })
    fireEvent.change(screen.getByLabelText('Company Name (required)'), {
      target: { value: 'company_name' },
    })
    fireEvent.change(screen.getByLabelText('Email (required)'), {
      target: { value: 'email' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('button', { name: 'Importing...' })).toBeInTheDocument()
  })
})
