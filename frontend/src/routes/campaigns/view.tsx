import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  CampaignsApiError,
  createCampaign,
  deleteCampaign,
  sendCampaign,
} from '../../features/campaigns/api/campaign-client'
import { CampaignForm, type CampaignFormValues } from '../../features/campaigns/components/campaign-form'
import { useCampaignsQuery } from '../../features/campaigns/hooks/useCampaignsQuery'
import type { Campaign } from '../../features/campaigns/types/campaign'
import { fetchCustomers } from '../../features/customers/api/customer-client'
import type { Customer } from '../../features/customers/types/customer'
import { fetchTemplates } from '../../features/templates/api/template-client'
import type { Template } from '../../features/templates/types/template'

function formatCreatedAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }
  return parsed.toLocaleString()
}

export function CampaignsPage() {
  const campaignsQuery = useCampaignsQuery()
  const { session } = useAuth()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoadingCreateData, setIsLoadingCreateData] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [pageSuccess, setPageSuccess] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [campaignPendingDelete, setCampaignPendingDelete] = useState<Campaign | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)

  const campaigns = campaignsQuery.data?.data ?? []

  const closeCreateDialog = () => {
    if (isLoadingCreateData || isCreating) {
      return
    }
    setIsCreateDialogOpen(false)
    setAvailableTemplates([])
    setAvailableCustomers([])
    setCreateError(null)
  }

  const openCreateDialog = async () => {
    setIsCreateDialogOpen(true)
    setIsLoadingCreateData(true)
    setCreateError(null)
    setPageError(null)
    setPageSuccess(null)

    if (!session?.access_token) {
      setCreateError('You must be authenticated to create campaigns.')
      setIsLoadingCreateData(false)
      return
    }

    try {
      const [templatesResponse, customersResponse] = await Promise.all([
        fetchTemplates(session.access_token),
        fetchCustomers(session.access_token, {
          page: 1,
          pageSize: 100,
          sort: 'company_name',
          order: 'asc',
        }),
      ])
      setAvailableTemplates(templatesResponse.data)
      setAvailableCustomers(customersResponse.data)
    } catch (error) {
      if (error instanceof Error) {
        setCreateError(error.message)
      } else {
        setCreateError('Unable to load data for campaign creation.')
      }
    } finally {
      setIsLoadingCreateData(false)
    }
  }

  const handleCreateCampaign = async (values: CampaignFormValues) => {
    if (!session?.access_token) {
      setCreateError('You must be authenticated to create campaigns.')
      return
    }

    setIsCreating(true)
    setCreateError(null)
    try {
      await createCampaign(session.access_token, values)
      setIsCreateDialogOpen(false)
      setAvailableTemplates([])
      setAvailableCustomers([])
      setPageError(null)
      setPageSuccess('Campaign created successfully.')
      await campaignsQuery.refetch()
    } catch (error) {
      if (error instanceof CampaignsApiError) {
        setCreateError(error.message)
      } else {
        setCreateError('Unable to create campaign.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const openDeleteDialog = (campaign: Campaign) => {
    setCampaignPendingDelete(campaign)
    setPageError(null)
    setPageSuccess(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCampaign = async () => {
    if (!campaignPendingDelete) {
      return
    }
    if (!session?.access_token) {
      setPageError('You must be authenticated to delete campaigns.')
      return
    }

    setIsDeleting(true)
    setPageError(null)
    setPageSuccess(null)
    try {
      await deleteCampaign(session.access_token, campaignPendingDelete.id)
      setIsDeleteDialogOpen(false)
      setCampaignPendingDelete(null)
      setPageSuccess('Campaign deleted successfully.')
      await campaignsQuery.refetch()
    } catch (error) {
      if (error instanceof CampaignsApiError) {
        setPageError(error.message)
      } else {
        setPageError('Unable to delete campaign.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!session?.access_token) {
      setPageError('You must be authenticated to send campaigns.')
      return
    }

    setSendingCampaignId(campaign.id)
    setPageError(null)
    setPageSuccess(null)
    try {
      const response = await sendCampaign(session.access_token, campaign.id)
      if (response.data.failed > 0) {
        setPageError('Campaign finished with failures. Check campaign details for errors.')
      } else {
        setPageSuccess('Campaign sent successfully.')
      }
      await campaignsQuery.refetch()
    } catch (error) {
      if (error instanceof CampaignsApiError) {
        setPageError(error.message)
      } else {
        setPageError('Unable to send campaign.')
      }
    } finally {
      setSendingCampaignId(null)
    }
  }

  if (campaignsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
          <Spinner />
          Loading campaigns...
        </CardContent>
      </Card>
    )
  }

  if (campaignsQuery.isError) {
    return (
      <Alert variant="destructive">
        {campaignsQuery.error instanceof Error
          ? campaignsQuery.error.message
          : 'Unexpected error while loading campaigns.'}
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Create and manage campaign drafts.</CardDescription>
          </div>
          <Button
            onClick={() => {
              void openCreateDialog()
            }}
          >
            Create Campaign
          </Button>
        </CardHeader>
        <CardContent>
          {pageSuccess ? <Alert variant="success">{pageSuccess}</Alert> : null}
          {pageError ? <Alert variant="destructive">{pageError}</Alert> : null}

          {campaigns.length === 0 ? (
            <p className="text-sm text-slate-600">No campaigns yet. Create your first campaign.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Number of Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-56">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>{campaign.template_name ?? '-'}</TableCell>
                    <TableCell>{campaign.recipients_count}</TableCell>
                    <TableCell className="capitalize">{campaign.status}</TableCell>
                    <TableCell>{formatCreatedAt(campaign.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/campaigns/${campaign.id}`}>Details</Link>
                        </Button>
                        {campaign.status === 'draft' ? (
                          <Button
                            size="sm"
                            disabled={sendingCampaignId !== null}
                            onClick={() => {
                              void handleSendCampaign(campaign)
                            }}
                          >
                            {sendingCampaignId === campaign.id ? 'Sending...' : 'Send'}
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(campaign)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isCreateDialogOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreateDialog} />
          <Card className="relative z-50 w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
              <CardDescription>Select a template and one or more customers.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCreateData ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Spinner />
                  Loading templates and customers...
                </div>
              ) : (
                <CampaignForm
                  templates={availableTemplates}
                  customers={availableCustomers}
                  isSubmitting={isCreating}
                  errorMessage={createError}
                  onCancel={closeCreateDialog}
                  onSubmit={handleCreateCampaign}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete campaign "{campaignPendingDelete?.name ?? 'Untitled'}"?
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
                void handleDeleteCampaign()
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
