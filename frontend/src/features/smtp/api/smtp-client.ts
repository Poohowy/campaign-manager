import type {
  SaveSmtpSettingsPayload,
  SaveSmtpSettingsResponse,
  SmtpSettingsResponse,
  SmtpTestPayload,
  SmtpTestResponse,
} from '../types/smtp'

type ErrorEnvelope = {
  error?: {
    code?: string
    message?: string
  }
}

export class SmtpApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function fetchSmtpSettings(accessToken: string): Promise<SmtpSettingsResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/smtp`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new SmtpApiError(
      payload?.error?.code ?? 'SMTP_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load SMTP settings.',
    )
  }

  return (await response.json()) as SmtpSettingsResponse
}

export async function saveSmtpSettings(
  accessToken: string,
  payload: SaveSmtpSettingsPayload,
): Promise<SaveSmtpSettingsResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/smtp`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new SmtpApiError(
      errorPayload?.error?.code ?? 'SMTP_SAVE_FAILED',
      errorPayload?.error?.message ?? 'Unable to save SMTP settings.',
    )
  }

  return (await response.json()) as SaveSmtpSettingsResponse
}

export async function sendSmtpTestEmail(
  accessToken: string,
  payload: SmtpTestPayload,
): Promise<SmtpTestResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/smtp/test`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new SmtpApiError(
      errorPayload?.error?.code ?? 'SMTP_TEST_FAILED',
      errorPayload?.error?.message ?? 'Unable to send test email.',
    )
  }

  return (await response.json()) as SmtpTestResponse
}
