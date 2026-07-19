import type { CustomersDeleteResponse, CustomersListResult } from '../types/customer'
import type { CustomerImportMappings, CustomerImportPreviewResponse, CustomerImportResponse } from '../types/customer-import'

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

export async function deleteCustomers(
  accessToken: string,
  customerIds: string[],
): Promise<CustomersDeleteResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/customers`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: customerIds }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CustomersApiError(
      payload?.error?.code ?? 'CUSTOMERS_DELETE_FAILED',
      payload?.error?.message ?? 'Unable to delete selected customers.',
    )
  }

  return (await response.json()) as CustomersDeleteResponse
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

export async function importCustomers(
  accessToken: string,
  file: File,
  mapping: CustomerImportMappings,
): Promise<CustomerImportResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('mapping', JSON.stringify(mapping))

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CustomersApiError(
      payload?.error?.code ?? 'CUSTOMERS_IMPORT_FAILED',
      payload?.error?.message ?? 'Unable to import customers.',
    )
  }

  return (await response.json()) as CustomerImportResponse
}
