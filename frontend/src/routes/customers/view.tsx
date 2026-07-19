import { type MouseEvent, useState } from 'react'
import { Alert } from '../../components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { CustomersApiError, deleteCustomers } from '../../features/customers/api/customer-client'
import { CustomerImportDialog } from '../../features/customers/components/customer-import-dialog'
import { useCustomersQuery } from '../../features/customers/hooks/useCustomersQuery'
import type { CustomerImportResult } from '../../features/customers/types/customer-import'

export function CustomersPage() {
  const customersQuery = useCustomersQuery()
  const { session } = useAuth()
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set())
  const [importSummary, setImportSummary] = useState<CustomerImportResult | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null)

  const handleImportCompleted = (result: CustomerImportResult) => {
    setImportSummary(result)
    setDeleteSuccessMessage(null)
    void customersQuery.refetch()
  }

  if (customersQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
          <Spinner />
          Loading customers...
        </CardContent>
      </Card>
    )
  }

  if (customersQuery.isError) {
    return (
      <Alert variant="destructive">
        {customersQuery.error instanceof Error
          ? customersQuery.error.message
          : 'Unexpected error while loading customers.'}
      </Alert>
    )
  }

  const customers = customersQuery.data?.data ?? []
  const selectedCount = selectedCustomerIds.size
  const hasSelection = selectedCount > 0
  const allVisibleSelected = customers.length > 0 && customers.every((customer) => selectedCustomerIds.has(customer.id))
  const someVisibleSelected = customers.some((customer) => selectedCustomerIds.has(customer.id)) && !allVisibleSelected

  const headerCheckboxState = allVisibleSelected
    ? true
    : someVisibleSelected
      ? ('indeterminate' as const)
      : false

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (nextSelection.has(customerId)) {
        nextSelection.delete(customerId)
      } else {
        nextSelection.add(customerId)
      }
      return nextSelection
    })
    setDeleteError(null)
    setDeleteSuccessMessage(null)
  }

  const toggleAllVisibleCustomers = (checked: boolean) => {
    setSelectedCustomerIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (checked) {
        customers.forEach((customer) => nextSelection.add(customer.id))
      } else {
        customers.forEach((customer) => nextSelection.delete(customer.id))
      }
      return nextSelection
    })
    setDeleteError(null)
    setDeleteSuccessMessage(null)
  }

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, customerId: string) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input, a, [data-interactive="true"]')) {
      return
    }
    toggleCustomerSelection(customerId)
  }

  const handleDeleteSelected = async () => {
    if (!hasSelection) {
      setDeleteError('Select at least one customer to delete.')
      return
    }

    if (!session?.access_token) {
      setDeleteError('You must be authenticated to delete customers.')
      return
    }

    setDeleteError(null)
    setDeleteSuccessMessage(null)
    setIsDeleting(true)
    try {
      const response = await deleteCustomers(session.access_token, Array.from(selectedCustomerIds))
      const deletedCount = response.data.deleted
      setSelectedCustomerIds(new Set())
      setIsDeleteDialogOpen(false)
      setImportSummary(null)
      setDeleteError(null)
      setDeleteSuccessMessage(
        deletedCount === 1
          ? 'Customer deleted successfully.'
          : `${deletedCount} customers deleted successfully.`,
      )
      void customersQuery.refetch()
    } catch (error) {
      setDeleteSuccessMessage(null)
      if (error instanceof CustomersApiError) {
        setDeleteError(error.message)
      } else {
        setDeleteError('Unable to delete selected customers.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const title = hasSelection
    ? `${selectedCount} customer${selectedCount === 1 ? '' : 's'} selected`
    : 'Customers'
  const description = hasSelection
    ? 'Manage your selected customers using bulk actions.'
    : 'Manage and review imported customers.'
  const showImportButton = !hasSelection

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection ? (
            <Button variant="outline" onClick={() => setSelectedCustomerIds(new Set())}>
              Clear Selection
            </Button>
          ) : null}
          {hasSelection ? (
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete Selected
            </Button>
          ) : null}
          {showImportButton ? (
            <CustomerImportDialog
              accessToken={session?.access_token}
              onImportCompleted={handleImportCompleted}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {importSummary ? (
          <Alert variant="success">
            Import completed. Imported: {importSummary.imported}, Updated: {importSummary.updated},
            Skipped: {importSummary.skipped}.
          </Alert>
        ) : null}
        {deleteSuccessMessage ? <Alert variant="success">{deleteSuccessMessage}</Alert> : null}
        {deleteError ? <Alert variant="destructive">{deleteError}</Alert> : null}

        {customers.length === 0 ? (
          <p className="text-sm text-slate-600">
            Your customer list is currently empty. Upload a CSV file to import customers.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    data-interactive="true"
                    checked={headerCheckboxState}
                    aria-label="Select all customers"
                    onCheckedChange={(checked) => toggleAllVisibleCustomers(Boolean(checked))}
                  />
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>External ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  data-state={selectedCustomerIds.has(customer.id) ? 'selected' : undefined}
                  onClick={(event) => handleRowClick(event, customer.id)}
                >
                  <TableCell>
                    <Checkbox
                      data-interactive="true"
                      checked={selectedCustomerIds.has(customer.id)}
                      aria-label={`Select customer ${customer.external_id}`}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleCustomerSelection(customer.id)}
                    />
                  </TableCell>
                  <TableCell>{customer.company_name ?? '-'}</TableCell>
                  <TableCell>{customer.contact_name ?? '-'}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone ?? '-'}</TableCell>
                  <TableCell>{customer.external_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customers</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete the selected customers?
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDeleteSelected()
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
