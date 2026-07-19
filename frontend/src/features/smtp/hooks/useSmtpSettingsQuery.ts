import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { fetchSmtpSettings } from '../api/smtp-client'

export function useSmtpSettingsQuery() {
  const { isAuthenticated, session } = useAuth()

  return useQuery({
    queryKey: ['smtp-settings', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Missing access token.')
      }
      return fetchSmtpSettings(accessToken)
    },
    enabled: isAuthenticated,
  })
}
