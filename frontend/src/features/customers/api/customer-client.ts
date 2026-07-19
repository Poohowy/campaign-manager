import type { CustomersListResult } from '../types/customer'
import type { CustomerImportPreviewResponse } from '../types/customer-import'

type ErrorEnvelope = {
  error?: {
    code?: string
    message?: string
  }
}

export class CustomersApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function fetchCustomers(accessToken: string): Promise<CustomersListResult> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/customers`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CustomersApiError(
      payload?.error?.code ?? 'CUSTOMERS_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load customers.',
    )
  }

  return (await response.json()) as CustomersListResult
}

export async function fetchCustomerImportPreview(
  accessToken: string,
  file: File,
): Promise<CustomerImportPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/import/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CustomersApiError(
      payload?.error?.code ?? 'CUSTOMERS_IMPORT_PREVIEW_FAILED',
      payload?.error?.message ?? 'Unable to preview CSV file.',
    )
  }

  return (await response.json()) as CustomerImportPreviewResponse
}
