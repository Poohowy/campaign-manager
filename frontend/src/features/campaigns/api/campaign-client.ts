import type {
  CampaignCreatePayload,
  CampaignDeleteResponse,
  CampaignMessagesResponse,
  CampaignResponse,
  CampaignSendResponse,
  CampaignsListResponse,
} from '../types/campaign'

type ErrorEnvelope = {
  error?: {
    code?: string
    message?: string
  }
}

export class CampaignsApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function fetchCampaigns(accessToken: string): Promise<CampaignsListResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      payload?.error?.code ?? 'CAMPAIGNS_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load campaigns.',
    )
  }

  return (await response.json()) as CampaignsListResponse
}

export async function createCampaign(
  accessToken: string,
  payload: CampaignCreatePayload,
): Promise<CampaignResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      errorPayload?.error?.code ?? 'CAMPAIGN_CREATE_FAILED',
      errorPayload?.error?.message ?? 'Unable to create campaign.',
    )
  }

  return (await response.json()) as CampaignResponse
}

export async function fetchCampaignById(
  accessToken: string,
  campaignId: string,
): Promise<CampaignResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns/${campaignId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      payload?.error?.code ?? 'CAMPAIGN_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load campaign.',
    )
  }

  return (await response.json()) as CampaignResponse
}

export async function deleteCampaign(
  accessToken: string,
  campaignId: string,
): Promise<CampaignDeleteResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns/${campaignId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      payload?.error?.code ?? 'CAMPAIGN_DELETE_FAILED',
      payload?.error?.message ?? 'Unable to delete campaign.',
    )
  }

  return (await response.json()) as CampaignDeleteResponse
}

export async function sendCampaign(
  accessToken: string,
  campaignId: string,
): Promise<CampaignSendResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns/${campaignId}/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      payload?.error?.code ?? 'CAMPAIGN_SEND_FAILED',
      payload?.error?.message ?? 'Unable to send campaign.',
    )
  }

  return (await response.json()) as CampaignSendResponse
}

export async function fetchCampaignMessages(
  accessToken: string,
  campaignId: string,
): Promise<CampaignMessagesResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns/${campaignId}/messages`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new CampaignsApiError(
      payload?.error?.code ?? 'CAMPAIGN_MESSAGES_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load campaign messages.',
    )
  }

  return (await response.json()) as CampaignMessagesResponse
}
