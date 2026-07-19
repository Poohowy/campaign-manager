import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { CampaignsPage } from './view'

const { createCampaignMock, deleteCampaignMock, sendCampaignMock } = vi.hoisted(() => ({
  createCampaignMock: vi.fn(),
  deleteCampaignMock: vi.fn(),
  sendCampaignMock: vi.fn(),
}))

const { fetchTemplatesMock } = vi.hoisted(() => ({
  fetchTemplatesMock: vi.fn(),
}))

const { fetchCustomersMock } = vi.hoisted(() => ({
  fetchCustomersMock: vi.fn(),
}))

type CampaignsQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data?: {
    data: Array<{
      id: string
      user_id: string
      template_id: string | null
      template_name: string | null
      name: string
      status: 'draft' | 'running' | 'completed' | 'failed'
      recipients_count: number
      customer_ids: string[]
      created_at: string
      started_at: string | null
      finished_at: string | null
      updated_at: string
    }>
  }
}

let campaignsQueryState: CampaignsQueryState

vi.mock('../../features/campaigns/hooks/useCampaignsQuery', () => ({
  useCampaignsQuery: () => campaignsQueryState,
}))

vi.mock('../../features/campaigns/api/campaign-client', () => {
  class CampaignsApiError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    CampaignsApiError,
    createCampaign: createCampaignMock,
    deleteCampaign: deleteCampaignMock,
    sendCampaign: sendCampaignMock,
  }
})

vi.mock('../../features/templates/api/template-client', () => ({
  fetchTemplates: fetchTemplatesMock,
}))

vi.mock('../../features/customers/api/customer-client', () => ({
  fetchCustomers: fetchCustomersMock,
}))

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    session: { access_token: 'token' },
    user: null,
  }),
}))

describe('CampaignsPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>,
    )

  beforeEach(() => {
    createCampaignMock.mockReset()
    deleteCampaignMock.mockReset()
    sendCampaignMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchCustomersMock.mockReset()
  })

  it('renders campaign list', () => {
    campaignsQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: [
          {
            id: 'cmp-1',
            user_id: 'u-1',
            template_id: 't-1',
            template_name: 'Welcome',
            name: 'July Campaign',
            status: 'draft',
            recipients_count: 3,
            customer_ids: ['c-1', 'c-2', 'c-3'],
            created_at: '2026-07-19T12:00:00.000Z',
            started_at: null,
            finished_at: null,
            updated_at: '2026-07-19T12:00:00.000Z',
          },
        ],
      },
    }

    renderPage()

    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('July Campaign')).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Campaign' })).toBeInTheDocument()
  })

  it('creates campaign and refreshes list', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    campaignsQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: { data: [] },
    }
    fetchTemplatesMock.mockResolvedValueOnce({
      data: [
        {
          id: 't-1',
          user_id: 'u-1',
          name: 'Welcome',
          description: null,
          subject: 'Hello',
          body_markdown: '# Welcome',
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        },
      ],
    })
    fetchCustomersMock.mockResolvedValueOnce({
      data: [
        {
          id: 'c-1',
          user_id: 'u-1',
          external_id: 'ext-1',
          email: 'alice@example.com',
          company_name: 'ACME',
          contact_name: null,
          phone: null,
          custom_fields: {},
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        page_size: 100,
        total: 1,
        total_pages: 1,
      },
    })
    createCampaignMock.mockResolvedValueOnce({
      data: { id: 'cmp-1' },
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    await waitFor(() => {
      expect(fetchTemplatesMock).toHaveBeenCalledTimes(1)
      expect(fetchCustomersMock).toHaveBeenCalledTimes(1)
    })

    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'July Campaign' } })
    fireEvent.change(screen.getByLabelText('Template'), { target: { value: 't-1' } })
    fireEvent.click(screen.getByLabelText('Select customer ext-1'))
    const submitButtons = screen.getAllByRole('button', { name: 'Create Campaign' })
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(createCampaignMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(createCampaignMock).toHaveBeenCalledWith('token', {
      name: 'July Campaign',
      template_id: 't-1',
      customer_ids: ['c-1'],
    })
    expect(screen.getByText('Campaign created successfully.')).toBeInTheDocument()
  })

  it('validates campaign form and supports customer search/multi-selection', async () => {
    campaignsQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: { data: [] },
    }
    fetchTemplatesMock.mockResolvedValueOnce({
      data: [
        {
          id: 't-1',
          user_id: 'u-1',
          name: 'Welcome',
          description: null,
          subject: 'Hello',
          body_markdown: '# Welcome',
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        },
      ],
    })
    fetchCustomersMock.mockResolvedValueOnce({
      data: [
        {
          id: 'c-1',
          user_id: 'u-1',
          external_id: 'ext-1',
          email: 'alice@example.com',
          company_name: 'ACME',
          contact_name: null,
          phone: null,
          custom_fields: {},
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        },
        {
          id: 'c-2',
          user_id: 'u-1',
          external_id: 'ext-2',
          email: 'bob@example.com',
          company_name: 'Globex',
          contact_name: null,
          phone: null,
          custom_fields: {},
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        page_size: 100,
        total: 2,
        total_pages: 1,
      },
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Create Campaign' }))

    await waitFor(() => {
      expect(fetchCustomersMock).toHaveBeenCalledTimes(1)
    })

    const submitButtons = screen.getAllByRole('button', { name: 'Create Campaign' })
    fireEvent.click(submitButtons[submitButtons.length - 1])
    expect(screen.getByText('Campaign Name is required.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search by company name'), {
      target: { value: 'acme' },
    })
    expect(screen.getByText('ACME')).toBeInTheDocument()
    expect(screen.queryByText('Globex')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Select all visible customers'))
    expect(screen.getByText('Number of Recipients: 1')).toBeInTheDocument()
  })

  it('deletes campaign after confirmation and refreshes list', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    campaignsQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: {
        data: [
          {
            id: 'cmp-1',
            user_id: 'u-1',
            template_id: 't-1',
            template_name: 'Welcome',
            name: 'July Campaign',
            status: 'draft',
            recipients_count: 3,
            customer_ids: ['c-1', 'c-2', 'c-3'],
            created_at: '2026-07-19T12:00:00.000Z',
            started_at: null,
            finished_at: null,
            updated_at: '2026-07-19T12:00:00.000Z',
          },
        ],
      },
    }
    deleteCampaignMock.mockResolvedValueOnce({
      data: { deleted: true },
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Delete Campaign')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteCampaignMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(deleteCampaignMock).toHaveBeenCalledWith('token', 'cmp-1')
    expect(screen.getByText('Campaign deleted successfully.')).toBeInTheDocument()
  })

  it('sends draft campaign and refreshes list', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    campaignsQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: {
        data: [
          {
            id: 'cmp-1',
            user_id: 'u-1',
            template_id: 't-1',
            template_name: 'Welcome',
            name: 'July Campaign',
            status: 'draft',
            recipients_count: 2,
            customer_ids: ['c-1', 'c-2'],
            created_at: '2026-07-19T12:00:00.000Z',
            started_at: null,
            finished_at: null,
            updated_at: '2026-07-19T12:00:00.000Z',
          },
        ],
      },
    }
    sendCampaignMock.mockResolvedValueOnce({
      data: {
        campaign_id: 'cmp-1',
        status: 'completed',
        sent: 2,
        failed: 0,
      },
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(sendCampaignMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(sendCampaignMock).toHaveBeenCalledWith('token', 'cmp-1')
    expect(screen.getByText('Campaign sent successfully.')).toBeInTheDocument()
  })
})
