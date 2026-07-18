import { supabase } from '../../../shared/api/supabase'
import { toAuthErrorMessage } from '../utils/auth-errors'

export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; message: string }

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      success: false,
      message: toAuthErrorMessage(error, 'Unable to sign in. Please try again.'),
    }
  }

  return { success: true }
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const emailRedirectTo = `${window.location.origin}/auth/login`
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  })

  if (error) {
    return {
      success: false,
      message: toAuthErrorMessage(error, 'Unable to register your account. Please try again.'),
    }
  }

  return {
    success: true,
    message: 'Verification email sent. Please check your inbox before signing in.',
  }
}

export async function sendPasswordReset(email: string): Promise<AuthActionResult> {
  const redirectTo = `${window.location.origin}/auth/login`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    return {
      success: false,
      message: toAuthErrorMessage(error, 'Unable to send password reset email. Please try again.'),
    }
  }

  return {
    success: true,
    message: 'Password reset instructions were sent to your email.',
  }
}

export async function signOut(): Promise<AuthActionResult> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      message: 'Unable to log out right now. Please try again.',
    }
  }

  return { success: true }
}
