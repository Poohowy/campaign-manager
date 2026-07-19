import { useState } from 'react'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Spinner } from '../../components/ui/spinner'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  saveSmtpSettings,
  sendSmtpTestEmail,
  SmtpApiError,
} from '../../features/smtp/api/smtp-client'
import { useSmtpSettingsQuery } from '../../features/smtp/hooks/useSmtpSettingsQuery'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type SmtpFormState = {
  host: string
  port: string
  username: string
  password: string
  fromName: string
  fromEmail: string
  useTls: boolean
}

export function SmtpPage() {
  const smtpQuery = useSmtpSettingsQuery()
  const { session } = useAuth()
  const [form, setForm] = useState<Partial<SmtpFormState>>({})
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState<string | null>(null)

  const loadedSettings = smtpQuery.data?.data
  const formHost = form.host ?? loadedSettings?.host ?? ''
  const formPort = form.port ?? (loadedSettings?.port != null ? String(loadedSettings.port) : '587')
  const formUsername = form.username ?? loadedSettings?.username ?? ''
  const formPassword = form.password ?? ''
  const formFromName = form.fromName ?? loadedSettings?.from_name ?? ''
  const formFromEmail = form.fromEmail ?? loadedSettings?.from_email ?? ''
  const formUseTls = form.useTls ?? loadedSettings?.use_tls ?? true

  const setField = (field: keyof SmtpFormState, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const validateSmtpForm = (): string | null => {
    if (!formHost.trim()) {
      return 'SMTP Host is required.'
    }
    if (!formPort.trim()) {
      return 'SMTP Port is required.'
    }
    const port = Number(formPort)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return 'SMTP Port must be a number between 1 and 65535.'
    }
    if (!formUsername.trim()) {
      return 'Username is required.'
    }
    if (!formFromName.trim()) {
      return 'From Name is required.'
    }
    if (!EMAIL_PATTERN.test(formFromEmail.trim())) {
      return 'From Email must be a valid email address.'
    }
    return null
  }

  const handleSave = async () => {
    if (!session?.access_token) {
      setSaveError('You must be authenticated to save SMTP settings.')
      return
    }

    const validationError = validateSmtpForm()
    if (validationError) {
      setSaveError(validationError)
      setSaveSuccess(null)
      return
    }

    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)
    try {
      await saveSmtpSettings(session.access_token, {
        host: formHost.trim(),
        port: Number(formPort),
        username: formUsername.trim(),
        password: formPassword.trim() ? formPassword : null,
        from_name: formFromName.trim(),
        from_email: formFromEmail.trim(),
        use_tls: formUseTls,
      })
      setSaveSuccess('SMTP settings saved successfully.')
      setForm((current) => ({
        ...current,
        password: '',
      }))
      await smtpQuery.refetch()
    } catch (error) {
      if (error instanceof SmtpApiError) {
        setSaveError(error.message)
      } else {
        setSaveError('Unable to save SMTP settings.')
      }
      setSaveSuccess(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!session?.access_token) {
      setTestError('You must be authenticated to send a test email.')
      return
    }
    if (!EMAIL_PATTERN.test(recipientEmail.trim())) {
      setTestError('Recipient Email must be a valid email address.')
      setTestSuccess(null)
      return
    }

    setTestError(null)
    setTestSuccess(null)
    setIsSendingTest(true)
    try {
      await sendSmtpTestEmail(session.access_token, {
        recipient: recipientEmail.trim(),
      })
      setTestSuccess('Test email sent successfully.')
    } catch (error) {
      if (error instanceof SmtpApiError) {
        setTestError(error.message)
      } else {
        setTestError('Unable to send test email.')
      }
      setTestSuccess(null)
    } finally {
      setIsSendingTest(false)
    }
  }

  if (smtpQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
          <Spinner />
          Loading SMTP settings...
        </CardContent>
      </Card>
    )
  }

  if (smtpQuery.isError) {
    return (
      <Alert variant="destructive">
        {smtpQuery.error instanceof Error
          ? smtpQuery.error.message
          : 'Unexpected error while loading SMTP settings.'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SMTP Settings</CardTitle>
          <CardDescription>Configure your SMTP server for sending campaign emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveError ? <Alert variant="destructive">{saveError}</Alert> : null}
          {saveSuccess ? <Alert variant="success">{saveSuccess}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              value={formHost}
              onChange={(event) => setField('host', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP Port</Label>
            <Input
              id="smtp-port"
              value={formPort}
              onChange={(event) => setField('port', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-username">Username</Label>
            <Input
              id="smtp-username"
              value={formUsername}
              onChange={(event) => setField('username', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-password">Password</Label>
            <Input
              id="smtp-password"
              type="password"
              value={formPassword}
              onChange={(event) => setField('password', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-from-name">From Name</Label>
            <Input
              id="smtp-from-name"
              value={formFromName}
              onChange={(event) => setField('fromName', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-from-email">From Email</Label>
            <Input
              id="smtp-from-email"
              value={formFromEmail}
              onChange={(event) => setField('fromEmail', event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="smtp-use-tls"
              checked={formUseTls}
              onCheckedChange={(checked) => setField('useTls', Boolean(checked))}
            />
            <Label htmlFor="smtp-use-tls">Use TLS</Label>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={isSaving}
              onClick={() => {
                void handleSave()
              }}
            >
              {isSaving ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                'Save SMTP Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test SMTP Connection</CardTitle>
          <CardDescription>Send a test email to verify your SMTP settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testError ? <Alert variant="destructive">{testError}</Alert> : null}
          {testSuccess ? <Alert variant="success">{testSuccess}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="smtp-test-recipient">Recipient Email</Label>
            <Input
              id="smtp-test-recipient"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              disabled={isSendingTest}
              onClick={() => {
                void handleSendTest()
              }}
            >
              {isSendingTest ? (
                <>
                  <Spinner />
                  Sending...
                </>
              ) : (
                'Send Test Email'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
