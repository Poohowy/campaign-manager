export type CampaignStatus = 'draft' | 'running' | 'completed' | 'failed'

export type Campaign = {
  id: string
  user_id: string
  template_id: string | null
  template_name: string | null
  name: string
  status: CampaignStatus
  recipients_count: number
  customer_ids: string[]
  created_at: string
  started_at: string | null
  finished_at: string | null
  updated_at: string
}

export type CampaignsListResponse = {
  data: Campaign[]
}

export type CampaignResponse = {
  data: Campaign
}

export type CampaignCreatePayload = {
  name: string
  template_id: string
  customer_ids: string[]
}

export type CampaignDeleteResponse = {
  data: {
    deleted: boolean
  }
}
