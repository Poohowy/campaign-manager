export type Customer = {
  id: string
  user_id: string
  external_id: string
  email: string
  company_name: string | null
  contact_name: string | null
  phone: string | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CustomersPagination = {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type CustomersListResult = {
  data: Customer[]
  pagination: CustomersPagination
}
