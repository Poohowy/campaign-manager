export type SmtpSettings = {
  host: string | null
  port: number | null
  username: string | null
  from_name: string | null
  from_email: string | null
  use_tls: boolean
}

export type SmtpSettingsResponse = {
  data: SmtpSettings | null
}

export type SaveSmtpSettingsPayload = {
  host: string
  port: number
  username: string
  password?: string | null
  from_name: string
  from_email: string
  use_tls: boolean
}

export type SaveSmtpSettingsResponse = {
  data: {
    saved: boolean
  }
}

export type SmtpTestPayload = {
  recipient: string
}

export type SmtpTestResponse = {
  data: {
    success: boolean
  }
}
