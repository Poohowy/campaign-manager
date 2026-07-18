import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Spinner } from '../../../components/ui/spinner'
import { signUpWithEmailPassword } from '../api/auth-client'
import { type RegisterFormValues, registerSchema } from '../schemas/auth-forms'
import { AuthFormShell } from './AuthFormShell'

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    setSuccessMessage(null)

    const result = await signUpWithEmailPassword(values.email, values.password)

    if (!result.success) {
      setServerError(result.message)
      return
    }

    setSuccessMessage(result.message ?? 'Account created successfully.')
    form.reset()
  })

  return (
    <AuthFormShell
      title="Create account"
      description="Start using Campaign Manager with your team."
      footer={
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-slate-900 underline underline-offset-4">
            Sign in
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
          <Label htmlFor="register-email">Email</Label>
          <Input id="register-email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <Input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Spinner />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </AuthFormShell>
  )
}
