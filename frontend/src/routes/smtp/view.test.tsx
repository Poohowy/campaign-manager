import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SmtpPage } from './view'

const { saveSmtpSettingsMock, sendSmtpTestEmailMock } = vi.hoisted(() => ({
  saveSmtpSettingsMock: vi.fn(),
  sendSmtpTestEmailMock: vi.fn(),
}))

type SmtpQueryState = {
  isLoading: boolean
  isError: boolean
  error?: unknown
  refetch: () => Promise<unknown>
  data?: {
    data: {
      host: string | null
      port: number | null
      username: string | null
      from_name: string | null
      from_email: string | null
      use_tls: boolean
    } | null
  }
}

let smtpQueryState: SmtpQueryState

vi.mock('../../features/smtp/hooks/useSmtpSettingsQuery', () => ({
  useSmtpSettingsQuery: () => smtpQueryState,
}))

vi.mock('../../features/smtp/api/smtp-client', () => {
  class SmtpApiError extends Error {
    code: string

    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }

  return {
    SmtpApiError,
    saveSmtpSettings: saveSmtpSettingsMock,
    sendSmtpTestEmail: sendSmtpTestEmailMock,
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

describe('SmtpPage', () => {
  beforeEach(() => {
    saveSmtpSettingsMock.mockReset()
    sendSmtpTestEmailMock.mockReset()
  })

  it('loads existing SMTP configuration and keeps password hidden', async () => {
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: {
          host: 'smtp.gmail.com',
          port: 587,
          username: 'john@example.com',
          from_name: 'John',
          from_email: 'john@example.com',
          use_tls: true,
        },
      },
    }

    render(<SmtpPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('SMTP Host')).toHaveValue('smtp.gmail.com')
    })
    expect(screen.getByLabelText('SMTP Port')).toHaveValue('587')
    expect(screen.getByLabelText('Username')).toHaveValue('john@example.com')
    expect(screen.getByLabelText('From Name')).toHaveValue('John')
    expect(screen.getByLabelText('From Email')).toHaveValue('john@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('saves SMTP settings and clears password field', async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined)
    saveSmtpSettingsMock.mockResolvedValueOnce({
      data: { saved: true },
    })
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: refetchMock,
      data: {
        data: null,
      },
    }

    render(<SmtpPage />)

    fireEvent.change(screen.getByLabelText('SMTP Host'), { target: { value: 'smtp.gmail.com' } })
    fireEvent.change(screen.getByLabelText('SMTP Port'), { target: { value: '587' } })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText('From Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('From Email'), { target: { value: 'john@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save SMTP Settings' }))

    await waitFor(() => {
      expect(saveSmtpSettingsMock).toHaveBeenCalledTimes(1)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
    expect(saveSmtpSettingsMock).toHaveBeenCalledWith('token', {
      host: 'smtp.gmail.com',
      port: 587,
      username: 'john@example.com',
      password: 'secret',
      from_name: 'John',
      from_email: 'john@example.com',
      use_tls: true,
    })
    expect(screen.getByText('SMTP settings saved successfully.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('sends test email and displays success message', async () => {
    sendSmtpTestEmailMock.mockResolvedValueOnce({
      data: { success: true },
    })
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: null,
      },
    }

    render(<SmtpPage />)

    fireEvent.change(screen.getByLabelText('Recipient Email'), {
      target: { value: 'recipient@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Test Email' }))

    await waitFor(() => {
      expect(sendSmtpTestEmailMock).toHaveBeenCalledTimes(1)
    })
    expect(sendSmtpTestEmailMock).toHaveBeenCalledWith('token', {
      recipient: 'recipient@example.com',
    })
    expect(screen.getByText('Test email sent successfully.')).toBeInTheDocument()
  })

  it('validates recipient email before sending test email', async () => {
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: null,
      },
    }

    render(<SmtpPage />)

    fireEvent.change(screen.getByLabelText('Recipient Email'), {
      target: { value: 'invalid-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Test Email' }))

    await waitFor(() => {
      expect(sendSmtpTestEmailMock).not.toHaveBeenCalled()
    })
    expect(screen.getByText('Recipient Email must be a valid email address.')).toBeInTheDocument()
  })

  it('validates SMTP form before save', async () => {
    smtpQueryState = {
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
      data: {
        data: null,
      },
    }

    render(<SmtpPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Save SMTP Settings' }))

    await waitFor(() => {
      expect(saveSmtpSettingsMock).not.toHaveBeenCalled()
    })
    expect(screen.getByText('SMTP Host is required.')).toBeInTheDocument()
  })
})
