import { Alert } from '../../components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { CustomerImportDialog } from '../../features/customers/components/customer-import-dialog'
import { useCustomersQuery } from '../../features/customers/hooks/useCustomersQuery'

export function CustomersPage() {
  const customersQuery = useCustomersQuery()
  const { session } = useAuth()

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

  if (customers.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Your customer list is currently empty.</CardDescription>
          </div>
          <CustomerImportDialog accessToken={session?.access_token} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Upload a CSV file to preview and map customer columns before import.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage and review imported customers.</CardDescription>
        </div>
        <CustomerImportDialog accessToken={session?.access_token} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>External ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.company_name ?? '-'}</TableCell>
                <TableCell>{customer.contact_name ?? '-'}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone ?? '-'}</TableCell>
                <TableCell>{customer.external_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
