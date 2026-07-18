import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Spinner } from '../../../components/ui/spinner'
import { sendPasswordReset } from '../api/auth-client'
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '../schemas/auth-forms'
import { AuthFormShell } from './AuthFormShell'

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    setSuccessMessage(null)

    const result = await sendPasswordReset(values.email)

    if (!result.success) {
      setServerError(result.message)
      return
    }

    setSuccessMessage(result.message ?? 'Password reset email sent.')
    form.reset()
  })

  return (
    <AuthFormShell
      title="Reset password"
      description="We will send a secure password reset link to your email."
      footer={
        <p className="text-sm text-slate-600">
          Remembered your password?{' '}
          <Link to="/auth/login" className="font-medium text-slate-900 underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          void onSubmit(event)
        }}
        noValidate
      >
        {serverError && <Alert variant="destructive">{serverError}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="forgot-password-email">Email</Label>
          <Input
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Spinner />
              Sending link...
            </>
          ) : (
            'Send reset email'
          )}
        </Button>
      </form>
    </AuthFormShell>
  )
}
