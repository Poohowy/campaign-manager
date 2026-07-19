import { useMemo, useState, type ChangeEvent } from 'react'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { CustomersApiError, fetchCustomerImportPreview, importCustomers } from '../api/customer-client'
import type {
  CustomerImportFieldKey,
  CustomerImportMappings,
  CustomerImportPreviewData,
  CustomerImportResult,
} from '../types/customer-import'

type CustomerImportDialogProps = {
  accessToken: string | undefined
  onImportCompleted: (result: CustomerImportResult) => void
}

type MappingField = {
  key: CustomerImportFieldKey
  label: string
  required: boolean
}

const mappingFields: MappingField[] = [
  { key: 'external_id', label: 'External ID', required: true },
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'contact_name', label: 'Contact Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'country', label: 'Country', required: false },
]

const requiredFieldKeys = mappingFields.filter((field) => field.required).map((field) => field.key)

export function CustomerImportDialog({ accessToken, onImportCompleted }: CustomerImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<CustomerImportPreviewData | null>(null)
  const [mappings, setMappings] = useState<CustomerImportMappings>({})

  const isContinueEnabled = useMemo(
    () => requiredFieldKeys.every((fieldKey) => Boolean(mappings[fieldKey])),
    [mappings],
  )

  const missingRequiredLabels = useMemo(
    () =>
      mappingFields
        .filter((field) => field.required && !mappings[field.key])
        .map((field) => field.label),
    [mappings],
  )

  const resetDialogState = () => {
    setSelectedFile(null)
    setIsUploading(false)
    setIsImporting(false)
    setUploadError(null)
    setImportError(null)
    setPreviewData(null)
    setMappings({})
  }

  const closeDialog = () => {
    setIsOpen(false)
    resetDialogState()
  }

  const openDialog = () => {
    setIsOpen(true)
  }

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setSelectedFile(nextFile)
    setUploadError(null)
    setImportError(null)
  }

  const updateMapping = (fieldKey: CustomerImportFieldKey, header: string) => {
    setMappings((currentMappings) => ({
      ...currentMappings,
      [fieldKey]: header || undefined,
    }))
    setImportError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a CSV file before uploading.')
      return
    }

    if (!accessToken) {
      setUploadError('You must be authenticated to preview customer imports.')
      return
    }

    setUploadError(null)
    setImportError(null)
    setIsUploading(true)
    try {
      const response = await fetchCustomerImportPreview(accessToken, selectedFile)
      setPreviewData(response.data)
      setMappings({})
    } catch (error) {
      if (error instanceof CustomersApiError) {
        setUploadError(error.message)
      } else {
        setUploadError('Unable to preview CSV file.')
      }
      setPreviewData(null)
      setMappings({})
    } finally {
      setIsUploading(false)
    }
  }

  const handleContinue = async () => {
    if (!isContinueEnabled) {
      return
    }

    if (!selectedFile) {
      setImportError('Please select a CSV file before importing.')
      return
    }

    if (!accessToken) {
      setImportError('You must be authenticated to import customers.')
      return
    }

    setImportError(null)
    setIsImporting(true)
    try {
      const response = await importCustomers(accessToken, selectedFile, mappings)
      onImportCompleted(response.data)
      closeDialog()
    } catch (error) {
      if (error instanceof CustomersApiError) {
        setImportError(error.message)
      } else {
        setImportError('Unable to import customers.')
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Button onClick={openDialog}>Import Customers</Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <Card className="w-full max-w-5xl">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Import Customers</CardTitle>
                <CardDescription>Upload a CSV file, preview rows and map columns.</CardDescription>
              </div>
              <Button variant="outline" onClick={closeDialog}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="customer-import-file">CSV File</Label>
                  <Input
                    id="customer-import-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelection}
                  />
                </div>
                <Button onClick={() => void handleUpload()} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload and Preview'}
                </Button>
              </div>

              {uploadError ? <Alert variant="destructive">{uploadError}</Alert> : null}

              {previewData ? (
                <div className="space-y-6">
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900">Detected columns</h4>
                    <p className="text-sm text-slate-600">{previewData.headers.join(', ')}</p>
                    <p className="text-sm text-slate-600">Total rows: {previewData.row_count}</p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900">Preview (first 10 rows)</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {previewData.headers.map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.preview.length > 0 ? (
                            previewData.preview.map((row, index) => (
                              <TableRow key={`preview-row-${index}`}>
                                {previewData.headers.map((header) => (
                                  <TableCell key={`${header}-${index}`}>{row[header] ?? ''}</TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={previewData.headers.length}>
                                No data rows were found in this CSV file.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900">Column mapping</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {mappingFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`mapping-${field.key}`}>
                            {field.label}
                            {field.required ? ' (required)' : ' (optional)'}
                          </Label>
                          <select
                            id={`mapping-${field.key}`}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            value={mappings[field.key] ?? ''}
                            onChange={(event) => updateMapping(field.key, event.target.value)}
                          >
                            <option value="">Select column</option>
                            {previewData.headers.map((header) => (
                              <option key={`${field.key}-${header}`} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {!isContinueEnabled ? (
                      <Alert variant="default">
                        Please map required fields: {missingRequiredLabels.join(', ')}.
                      </Alert>
                    ) : null}

                    {importError ? <Alert variant="destructive">{importError}</Alert> : null}

                    <div className="flex justify-end">
                      <Button onClick={() => void handleContinue()} disabled={!isContinueEnabled || isImporting}>
                        {isImporting ? 'Importing...' : 'Continue'}
                      </Button>
                    </div>
                  </section>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  )
}
