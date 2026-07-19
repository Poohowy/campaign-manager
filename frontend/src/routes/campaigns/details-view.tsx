import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  CampaignsApiError,
  fetchCampaignById,
  fetchCampaignMessages,
} from '../../features/campaigns/api/campaign-client'
import type { Campaign, CampaignMessage } from '../../features/campaigns/types/campaign'

function formatDate(value: string | null): string {
  if (!value) {
    return '-'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }
  return parsed.toLocaleString()
}

export function CampaignDetailsPage() {
  const { campaignId } = useParams()
  const { session } = useAuth()
  const accessToken = session?.access_token
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [messages, setMessages] = useState<CampaignMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || !campaignId) {
      return
    }

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [campaignResponse, messagesResponse] = await Promise.all([
          fetchCampaignById(accessToken, campaignId),
          fetchCampaignMessages(accessToken, campaignId),
        ])
        if (!isMounted) {
          return
        }
        setCampaign(campaignResponse.data)
        setMessages(messagesResponse.data)
      } catch (err) {
        if (!isMounted) {
          return
        }
        if (err instanceof CampaignsApiError) {
          setError(err.message)
        } else {
          setError('Unable to load campaign details.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [accessToken, campaignId])

  if (!accessToken || !campaignId) {
    return <Alert variant="destructive">Unable to load campaign details.</Alert>
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
          <Spinner />
          Loading campaign details...
        </CardContent>
      </Card>
    )
  }

  if (error || campaign === null) {
    return <Alert variant="destructive">{error ?? 'Campaign not found.'}</Alert>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>Campaign status and delivery summary.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/campaigns">Back to Campaigns</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <span className="font-medium">Template:</span> {campaign.template_name ?? '-'}
          </p>
          <p>
            <span className="font-medium">Status:</span>{' '}
            <span className="capitalize">{campaign.status}</span>
          </p>
          <p>
            <span className="font-medium">Created At:</span> {formatDate(campaign.created_at)}
          </p>
          <p>
            <span className="font-medium">Started At:</span> {formatDate(campaign.started_at)}
          </p>
          <p>
            <span className="font-medium">Finished At:</span> {formatDate(campaign.finished_at)}
          </p>
          <p>
            <span className="font-medium">Recipients:</span> {campaign.recipients_count}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Per-recipient delivery status for this campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-600">No campaign messages found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{message.email ?? '-'}</TableCell>
                    <TableCell className="capitalize">{message.status}</TableCell>
                    <TableCell>{formatDate(message.sent_at)}</TableCell>
                    <TableCell>{message.error_message ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
