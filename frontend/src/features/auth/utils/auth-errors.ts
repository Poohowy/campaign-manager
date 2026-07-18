type AuthErrorSource = {
  message?: string
}

export function toAuthErrorMessage(
  source: AuthErrorSource | null | undefined,
  fallbackMessage: string,
): string {
  const message = source?.message?.toLowerCase() ?? ''

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }

  if (message.includes('email not confirmed') || message.includes('email is not confirmed')) {
    return 'Please verify your email before signing in.'
  }

  if (message.includes('user already registered')) {
    return 'An account with this email already exists.'
  }

  if (message.includes('password should be at least') || message.includes('weak password')) {
    return 'Password is too weak. Use at least 8 characters.'
  }

  return fallbackMessage
}
