import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { fetchTemplates } from '../api/template-client'

export function useTemplatesQuery() {
  const { isAuthenticated, session } = useAuth()

  return useQuery({
    queryKey: ['templates', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Missing access token.')
      }
      return fetchTemplates(accessToken)
    },
    enabled: isAuthenticated,
  })
}
