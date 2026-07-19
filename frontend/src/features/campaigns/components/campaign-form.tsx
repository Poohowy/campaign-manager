import { type FormEvent, useMemo, useState } from 'react'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import type { Customer } from '../../customers/types/customer'
import type { Template } from '../../templates/types/template'

export type CampaignFormValues = {
  name: string
  template_id: string
  customer_ids: string[]
}

type CampaignFormProps = {
  templates: Template[]
  customers: Customer[]
  isSubmitting: boolean
  errorMessage: string | null
  onCancel: () => void
  onSubmit: (values: CampaignFormValues) => Promise<void>
}

export function CampaignForm({
  templates,
  customers,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: CampaignFormProps) {
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const visibleCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return customers
    }

    return customers.filter((customer) =>
      (customer.company_name ?? '').toLowerCase().includes(normalizedSearch),
    )
  }, [customers, searchTerm])

  const allVisibleSelected =
    visibleCustomers.length > 0 && visibleCustomers.every((customer) => selectedCustomerIds.has(customer.id))
  const someVisibleSelected =
    visibleCustomers.some((customer) => selectedCustomerIds.has(customer.id)) && !allVisibleSelected
  const headerCheckboxState = allVisibleSelected
    ? true
    : someVisibleSelected
      ? ('indeterminate' as const)
      : false

  const selectedTemplate = templates.find((template) => template.id === templateId)
  const selectedRecipients = selectedCustomerIds.size

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (nextSelection.has(customerId)) {
        nextSelection.delete(customerId)
      } else {
        nextSelection.add(customerId)
      }
      return nextSelection
    })
    setValidationMessage(null)
  }

  const toggleAllVisible = (checked: boolean) => {
    setSelectedCustomerIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (checked) {
        visibleCustomers.forEach((customer) => nextSelection.add(customer.id))
      } else {
        visibleCustomers.forEach((customer) => nextSelection.delete(customer.id))
      }
      return nextSelection
    })
    setValidationMessage(null)
  }

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Campaign Name is required.'
    }
    if (!templateId) {
      return 'Template is required.'
    }
    if (selectedCustomerIds.size === 0) {
      return 'Select at least one customer.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validate()
    if (validationError) {
      setValidationMessage(validationError)
      return
    }

    setValidationMessage(null)
    await onSubmit({
      name: name.trim(),
      template_id: templateId,
      customer_ids: Array.from(selectedCustomerIds),
    })
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      {validationMessage ? <Alert variant="destructive">{validationMessage}</Alert> : null}
      {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setValidationMessage(null)
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-template">Template</Label>
        <select
          id="campaign-template"
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          value={templateId}
          onChange={(event) => {
            setTemplateId(event.target.value)
            setValidationMessage(null)
          }}
        >
          <option value="">Select template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name ?? 'Untitled template'}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-customer-search">Search by company name</Label>
        <Input
          id="campaign-customer-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search company..."
        />
      </div>

      <div className="rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={headerCheckboxState}
                  aria-label="Select all visible customers"
                  onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-sm text-slate-600">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              visibleCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomerIds.has(customer.id)}
                      aria-label={`Select customer ${customer.external_id}`}
                      onCheckedChange={() => toggleCustomer(customer.id)}
                    />
                  </TableCell>
                  <TableCell>{customer.company_name ?? '-'}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Campaign Summary</p>
        <p className="mt-2 text-sm text-slate-900">Campaign Name: {name.trim() || '-'}</p>
        <p className="text-sm text-slate-900">Selected Template: {selectedTemplate?.name ?? '-'}</p>
        <p className="text-sm text-slate-900">Number of Recipients: {selectedRecipients}</p>
        <p className="text-sm text-slate-900">Initial Status: Draft</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  )
}
