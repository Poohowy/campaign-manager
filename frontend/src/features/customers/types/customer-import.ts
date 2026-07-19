export type CustomerImportPreviewData = {
  headers: string[]
  preview: Record<string, string>[]
  row_count: number
}

export type CustomerImportPreviewResponse = {
  data: CustomerImportPreviewData
}

export type CustomerImportResult = {
  imported: number
  updated: number
  skipped: number
}

export type CustomerImportResponse = {
  data: CustomerImportResult
}

export type CustomerImportFieldKey =
  | 'external_id'
  | 'company_name'
  | 'email'
  | 'contact_name'
  | 'phone'
  | 'website'
  | 'city'
  | 'country'

export type CustomerImportMappings = Partial<Record<CustomerImportFieldKey, string>>
