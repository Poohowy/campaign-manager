import type {
  TemplateDeleteResponse,
  TemplateRenderPayload,
  TemplateRenderResponse,
  TemplatesListResponse,
  TemplateResponse,
  TemplateUpsertPayload,
} from '../types/template'

type ErrorEnvelope = {
  error?: {
    code?: string
    message?: string
  }
}

export class TemplatesApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function fetchTemplates(accessToken: string): Promise<TemplatesListResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/templates`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new TemplatesApiError(
      payload?.error?.code ?? 'TEMPLATES_FETCH_FAILED',
      payload?.error?.message ?? 'Unable to load templates.',
    )
  }

  return (await response.json()) as TemplatesListResponse
}

export async function createTemplate(
  accessToken: string,
  payload: TemplateUpsertPayload,
): Promise<TemplateResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/templates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new TemplatesApiError(
      errorPayload?.error?.code ?? 'TEMPLATE_CREATE_FAILED',
      errorPayload?.error?.message ?? 'Unable to create template.',
    )
  }

  return (await response.json()) as TemplateResponse
}

export async function updateTemplate(
  accessToken: string,
  templateId: string,
  payload: TemplateUpsertPayload,
): Promise<TemplateResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new TemplatesApiError(
      errorPayload?.error?.code ?? 'TEMPLATE_UPDATE_FAILED',
      errorPayload?.error?.message ?? 'Unable to update template.',
    )
  }

  return (await response.json()) as TemplateResponse
}

export async function deleteTemplate(
  accessToken: string,
  templateId: string,
): Promise<TemplateDeleteResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new TemplatesApiError(
      payload?.error?.code ?? 'TEMPLATE_DELETE_FAILED',
      payload?.error?.message ?? 'Unable to delete template.',
    )
  }

  return (await response.json()) as TemplateDeleteResponse
}

export async function renderTemplate(
  accessToken: string,
  payload: TemplateRenderPayload,
): Promise<TemplateRenderResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/templates/render`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ErrorEnvelope | null
    throw new TemplatesApiError(
      errorPayload?.error?.code ?? 'TEMPLATE_RENDER_FAILED',
      errorPayload?.error?.message ?? 'Unable to render template preview.',
    )
  }

  return (await response.json()) as TemplateRenderResponse
}
