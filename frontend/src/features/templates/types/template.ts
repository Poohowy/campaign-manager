export type Template = {
  id: string
  user_id: string
  name: string | null
  description: string | null
  subject: string | null
  body_markdown: string | null
  created_at: string
  updated_at: string
}

export type TemplatesListResponse = {
  data: Template[]
}

export type TemplateResponse = {
  data: Template
}

export type TemplateDeleteResponse = {
  data: {
    deleted: boolean
  }
}

export type TemplateUpsertPayload = {
  name: string
  subject: string
  body_markdown: string
}
