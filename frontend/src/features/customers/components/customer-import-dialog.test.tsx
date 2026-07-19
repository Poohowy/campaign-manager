import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CustomerImportDialog } from './customer-import-dialog'

const { fetchCustomerImportPreviewMock } = vi.hoisted(() => ({
  fetchCustomerImportPreviewMock: vi.fn(),
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
  }
})

describe('CustomerImportDialog', () => {
  it('validates file selection before upload', () => {
    render(<CustomerImportDialog accessToken="token" />)

    fireEvent.click(screen.getByRole('button', { name: 'Import Customers' }))
    fireEvent.click(screen.getByRole('button', { name: 'Upload and Preview' }))

    expect(screen.getByText('Please select a CSV file before uploading.')).toBeInTheDocument()
  })

  it('requires required field mappings before continue', async () => {
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

    render(<CustomerImportDialog accessToken="token" />)

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
    expect(
      screen.getByText('Column mapping is valid. Data import will be implemented in the next sprint.'),
    ).toBeInTheDocument()
  })
})
