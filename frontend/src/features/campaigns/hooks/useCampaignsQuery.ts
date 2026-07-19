import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { fetchCampaigns } from '../api/campaign-client'

export function useCampaignsQuery() {
  const { isAuthenticated, session } = useAuth()

  return useQuery({
    queryKey: ['campaigns', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Missing access token.')
      }
      return fetchCampaigns(accessToken)
    },
    enabled: isAuthenticated,
  })
}
