import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { CampaignDetailsPage } from './details-view'

const { fetchCampaignByIdMock, fetchCampaignMessagesMock } = vi.hoisted(() => ({
  fetchCampaignByIdMock: vi.fn(),
  fetchCampaignMessagesMock: vi.fn(),
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
    fetchCampaignById: fetchCampaignByIdMock,
    fetchCampaignMessages: fetchCampaignMessagesMock,
  }
})

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    session: { access_token: 'token' },
    user: null,
  }),
}))

describe('CampaignDetailsPage', () => {
  beforeEach(() => {
    fetchCampaignByIdMock.mockReset()
    fetchCampaignMessagesMock.mockReset()
  })

  it('renders campaign message delivery statuses', async () => {
    fetchCampaignByIdMock.mockResolvedValueOnce({
      data: {
        id: 'cmp-1',
        user_id: 'u-1',
        template_id: 't-1',
        template_name: 'Welcome',
        name: 'July Campaign',
        status: 'failed',
        recipients_count: 2,
        customer_ids: ['c-1', 'c-2'],
        created_at: '2026-07-19T12:00:00.000Z',
        started_at: '2026-07-19T12:05:00.000Z',
        finished_at: '2026-07-19T12:06:00.000Z',
        updated_at: '2026-07-19T12:06:00.000Z',
      },
    })
    fetchCampaignMessagesMock.mockResolvedValueOnce({
      data: [
        {
          id: 'msg-1',
          user_id: 'u-1',
          campaign_id: 'cmp-1',
          customer_id: 'c-1',
          email: 'ok@example.com',
          status: 'sent',
          sent_at: '2026-07-19T12:05:10.000Z',
          error_message: null,
        },
        {
          id: 'msg-2',
          user_id: 'u-1',
          campaign_id: 'cmp-1',
          customer_id: 'c-2',
          email: 'fail@example.com',
          status: 'failed',
          sent_at: '2026-07-19T12:05:15.000Z',
          error_message: 'Unable to send email to this recipient.',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/campaigns/cmp-1']}>
        <Routes>
          <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchCampaignByIdMock).toHaveBeenCalledTimes(1)
      expect(fetchCampaignMessagesMock).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('July Campaign')).toBeInTheDocument()
    expect(screen.getByText('ok@example.com')).toBeInTheDocument()
    expect(screen.getByText('fail@example.com')).toBeInTheDocument()
    expect(screen.getByText('Unable to send email to this recipient.')).toBeInTheDocument()
  })
})
