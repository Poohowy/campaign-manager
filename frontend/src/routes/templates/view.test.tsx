import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TemplatesPage } from './view'

const { createTemplateMock, updateTemplateMock, deleteTemplateMock, renderTemplateMock } = vi.hoisted(
  () => ({
  createTemplateMock: vi.fn(),
  updateTemplateMock: vi.fn(),
  deleteTemplateMock: vi.fn(),
    renderTemplateMock: vi.fn(),
  }),
)
const { fetchCustomersMock } = vi.hoisted(() => ({
  fetchCustomersMock: vi.fn(),
}))

type TemplatesQueryState = {
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
  data?: {
    data: Array<{
      id: string
      user_id: string
      name: string | null
      description: string | null
      subject: string | null
      body_markdown: string | null
      created_at: string
      updated_at: string
    }>
  }
}

let templatesQueryState: TemplatesQueryState

vi.mock('../../features/templates/hooks/useTemplatesQuery', () => ({
  useTemplatesQuery: () => templatesQueryState,
}))

vi.mock('../../features/templates/api/template-client', () => {
  class TemplatesApiError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    TemplatesApiError,
    createTemplate: createTemplateMock,
    updateTemplate: updateTemplateMock,
    deleteTemplate: deleteTemplateMock,
    renderTemplate: renderTemplateMock,
  }
})

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

describe('TemplatesPage', () => {
  beforeEach(() => {
    createTemplateMock.mockReset()
    updateTemplateMock.mockReset()
    deleteTemplateMock.mockReset()
    renderTemplateMock.mockReset()
    fetchCustomersMock.mockReset()
  })

  it('renders template list', () => {
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
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
      },
    }

    render(<TemplatesPage />)

    expect(screen.getByText('Templates')).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Template' })).toBeInTheDocument()
  })

  it('opens create dialog and creates a template with automatic refresh', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    createTemplateMock.mockResolvedValueOnce({
      data: { id: 't-1' },
    })
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: { data: [] },
    }

    render(<TemplatesPage />)
    const createButtons = screen.getAllByRole('button', { name: 'Create Template' })
    fireEvent.click(createButtons[createButtons.length - 1])

    expect(screen.getByRole('heading', { name: 'Create Template' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Template Name'), { target: { value: 'New Template' } })
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Subject line' } })
    fireEvent.change(screen.getByLabelText('Body (Markdown)'), { target: { value: '# Body' } })
    const submitCreateButtons = screen.getAllByRole('button', { name: 'Create Template' })
    fireEvent.click(submitCreateButtons[submitCreateButtons.length - 1])

    await waitFor(() => {
      expect(createTemplateMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
  })

  it('opens edit dialog prefilled with selected template', () => {
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
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
      },
    }

    render(<TemplatesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByText('Edit Template')).toBeInTheDocument()
    expect(screen.getByLabelText('Template Name')).toHaveValue('Welcome')
    expect(screen.getByLabelText('Subject')).toHaveValue('Hello')
    expect(screen.getByLabelText('Body (Markdown)')).toHaveValue('# Welcome')
  })

  it('shows delete confirmation and refreshes after delete', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    deleteTemplateMock.mockResolvedValueOnce({
      data: { deleted: true },
    })
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: {
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
      },
    }

    render(<TemplatesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Delete Template')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteTemplateMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('Template deleted successfully.')).toBeInTheDocument()
  })

  it('renders template preview via backend for selected customer', async () => {
    fetchCustomersMock.mockResolvedValueOnce({
      data: [
        {
          id: 'c-1',
          user_id: 'u-1',
          external_id: 'ext-1',
          email: 'alice@acme.com',
          company_name: 'ACME',
          contact_name: 'Alice',
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
    renderTemplateMock.mockResolvedValueOnce({
      data: {
        subject: 'Hello ACME',
        body: '# Welcome',
      },
    })
    templatesQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
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
      },
    }

    render(<TemplatesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

    await waitFor(() => {
      expect(fetchCustomersMock).toHaveBeenCalledTimes(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Render Preview' }))

    await waitFor(() => {
      expect(renderTemplateMock).toHaveBeenCalledTimes(1)
      expect(renderTemplateMock).toHaveBeenCalledWith('token', {
        template_id: 't-1',
        customer_id: 'c-1',
      })
    })
    expect(screen.getByText('Rendered Subject')).toBeInTheDocument()
    expect(screen.getByText('Hello ACME')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
  })
})
