import { useQuery } from '@tanstack/react-query'
import { fetchCustomers } from '../api/customer-client'
import { useAuth } from '../../auth/hooks/useAuth'

export function useCustomersQuery() {
  const { isAuthenticated, session } = useAuth()

  return useQuery({
    queryKey: ['customers', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Missing access token.')
      }
      return fetchCustomers(accessToken)
    },
    enabled: isAuthenticated,
  })
}
