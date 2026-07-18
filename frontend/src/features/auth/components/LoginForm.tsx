import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Spinner } from '../../../components/ui/spinner'
import { signInWithEmailPassword } from '../api/auth-client'
import { type LoginFormValues, loginSchema } from '../schemas/auth-forms'
import { AuthFormShell } from './AuthFormShell'

export function LoginForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)

    const result = await signInWithEmailPassword(values.email, values.password)

    if (!result.success) {
      setServerError(result.message)
      return
    }

    void navigate('/dashboard', { replace: true })
  })

  return (
    <AuthFormShell
      title="Sign in"
      description="Access your Campaign Manager workspace."
      footer={
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            No account yet?{' '}
            <Link to="/auth/register" className="font-medium text-slate-900 underline underline-offset-4">
              Create one
            </Link>
          </p>
          <p>
            <Link
              to="/auth/forgot-password"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
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

        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Spinner />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </AuthFormShell>
  )
}
